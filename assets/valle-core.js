/* ============================================================================
   valle-core.js — Motor del "Valle de lo Siniestro" (Uncanny Valley)
   ----------------------------------------------------------------------------
   Contiene, sin dependencias y sin tocar el DOM:
     · El catálogo de robots (cine/TV, anime y compañías reales).
     · La curva de referencia (Mori, 1970) y utilidades para recorrerla.
     · El análisis de una sesión de votos.
     · El generador de feedback textual personalizado.
     · La exportación a CSV / resumen de texto.

   Se puede usar en el navegador (window.ValleCore) y en Node
   (module.exports) para pruebas.
   ========================================================================== */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ValleCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 1. CATÁLOGO
   * ------------------------------------------------------------------ *
   * `refRealismo` es la posición horizontal (0–100 %) en la que el robot
   * cae dentro del eje "parecido a un humano", según el consenso de los
   * estudios de apariencia (Mori 1970; MacDorman & Ishiguro 2006;
   * Mathur & Reichling 2016; Kim, de Visser & Phillips 2022).
   * Es una REFERENCIA orientativa, no una medida exacta: sirve para
   * comparar la percepción de cada persona con la del "estudio".
   */
  const CATEGORIAS = {
    cine:     { id: 'cine',     nombre: 'Cine y TV',        color: '#7c6cf0' },
    anime:    { id: 'anime',    nombre: 'Anime y manga',    color: '#28c9b7' },
    compania: { id: 'compania', nombre: 'Compañías reales', color: '#e5726a' }
  };

  const ROBOTS = [
    /* ---- Cine y TV -------------------------------------------------- */
    {
      id: 'maria', nombre: 'Maria (Maschinenmensch)', obra: 'Metropolis (Fritz Lang)',
      anio: 1927, cat: 'cine', img: 'assets/robots/maria_metropolis.jpg', refRealismo: 20,
      dato: 'Es el robot más antiguo de esta lista: la "mujer máquina" de 1927. Brigitte Helm pasaba horas dentro de un traje de metal que apenas la dejaba moverse. Su diseño definió para siempre la silueta humanoide metálica.'
    },
    {
      id: 'c3po', nombre: 'C-3PO', obra: 'Star Wars',
      anio: 1977, cat: 'cine', img: 'assets/robots/c3po_starwars.jpg', refRealismo: 22,
      dato: 'Anthony Daniels, su actor, es la única persona que aparece en las nueve películas de la saga. El diseño se inspiró en el robot de Metropolis: cuerpo humano, articulaciones a la vista y todas las "tripas" por fuera.'
    },
    {
      id: 'walle', nombre: 'WALL·E', obra: 'Pixar',
      anio: 2008, cat: 'cine', img: 'assets/robots/walle_pixar.jpg', refRealismo: 14,
      dato: 'Un cubo con ojos de binoculares, sin boca ni voz articulada, que transmite más emoción que muchos personajes humanos. Pixar animó la película como si fuera cine mudo: casi todo se entiende por gestos.'
    },
    {
      id: 't800', nombre: 'T-800 (endosqueleto)', obra: 'Terminator',
      anio: 1984, cat: 'cine', img: 'assets/robots/t800_terminator.jpg', refRealismo: 45,
      dato: 'La calavera metálica más famosa del cine. Está diseñado justo en la frontera incómoda: tiene claramente forma humana (cráneo, brazos, manos) pero cero piel. Una carcasa de persona sin persona dentro.'
    },
    {
      id: 'ava', nombre: 'Ava', obra: 'Ex Machina',
      anio: 2015, cat: 'cine', img: 'assets/robots/ava_exmachina.jpg', refRealismo: 82,
      dato: 'Su cara es humana, pero el cuerpo es translúcido y muestra engranajes y paneles. El director pidió que el público pudiera ver "el cerebro" a través del torso: es un cuerpo casi humano que se delata a sí mismo.'
    },

    /* ---- Anime y manga ---------------------------------------------- */
    {
      id: 'astroboy', nombre: 'Astro Boy (Tetsuwan Atom)', obra: 'Osamu Tezuka',
      anio: 1952, cat: 'anime', img: 'assets/robots/astroboy_anime.jpg', refRealismo: 18,
      dato: 'El gran antecesor del anime. Tezuka lo creó como un niño robot con ojos grandes casi de animal: cuanto más humano el rostro, más fácil el cariño. El manga tiene episodios sorprendentemente tristes sobre ser una máquina.'
    },
    {
      id: 'doraemon', nombre: 'Doraemon', obra: 'Fujiko F. Fujio',
      anio: 1969, cat: 'anime', img: 'assets/robots/doraemon_anime.jpg', refRealismo: 10,
      dato: 'Un gato robot con bolsillo mágico. Le faltan las orejas porque una rata se las comió, y su forma redonda salió de un error de diseño. Es la prueba de que el atractivo no depende del parecido humano, sino de la coherencia del diseño.'
    },
    {
      id: 'gundam', nombre: 'RX-78-2 Gundam', obra: 'Mobile Suit Gundam',
      anio: 1979, cat: 'anime', img: 'assets/robots/gundam_rx78.jpg', refRealismo: 30,
      dato: '18 metros de metal. Su "cara" tiene dos ojos luminosos y una placa tipo boca, suficiente para leerle emociones cuando combate. Marcó la idea del mecha como personaje trágico y no solo como arma.'
    },
    {
      id: 'motoko', nombre: 'Motoko Kusanagi', obra: 'Ghost in the Shell',
      anio: 1995, cat: 'anime', img: 'assets/robots/motoko_gits.jpg', refRealismo: 78,
      dato: 'Un cerebro humano en un cuerpo 100 % artificial reconstruible. La película levanta la pregunta que este simulador hace con imágenes: si el cuerpo es indistinguible del humano, ¿dónde queda el límite de lo siniestro?'
    },
    {
      id: '2b', nombre: '2B (YoRHa N.º 2 Tipo B)', obra: 'NieR: Automata',
      anio: 2017, cat: 'anime', img: 'assets/robots/nier2b_automata.jpg', refRealismo: 55,
      dato: 'Una androide de combate con anatomía humana estilizada, visera negra y tela en lugar de piel. Cae en una zona intermedia muy interesante: no es caricatura ni humano, y el ojo no sabe a qué categoría mandarla.'
    },

    /* ---- Compañías reales ------------------------------------------- */
    {
      id: 'asimo', nombre: 'ASIMO', obra: 'Honda',
      anio: 2000, cat: 'compania', img: 'assets/robots/asimo_honda.jpg', refRealismo: 28,
      dato: 'Durante casi 20 años fue la cara amable de la robótica: 130 cm, andar suave y una inclinación de cabeza que parecía cortesía. Honda lo jubiló en 2018 tras 18 generaciones.'
    },
    {
      id: 'pepper', nombre: 'Pepper', obra: 'SoftBank Robotics',
      anio: 2014, cat: 'compania', img: 'assets/robots/pepper_softbank.jpg', refRealismo: 24,
      dato: 'Diseñado explícitamente para gustar: cabeza grande, ojos redondos y una tablet en el pecho para que la interacción sea "de persona a persona". Se usó en tiendas, aeropuertos y hospitales.'
    },
    {
      id: 'spot', nombre: 'Spot', obra: 'Boston Dynamics',
      anio: 2015, cat: 'compania', img: 'assets/robots/spot_bostondynamics.jpg', refRealismo: 20,
      dato: 'Cuadrúpedo amarillo que inspecciona fábricas y obras. Su diseño no intenta parecerse a nadie, y por eso casi nunca cae mal: el parecido humano es una de las fuentes del desagrado, no un requisito del encanto.'
    },
    {
      id: 'sophia', nombre: 'Sophia', obra: 'Hanson Robotics',
      anio: 2016, cat: 'compania', img: 'assets/robots/sophia_hanson.jpg', refRealismo: 84,
      dato: 'Fue el primer robot en recibir una ciudadanía (Arabia Saudí, 2017) y el primero en ser nombrado embajador de un programa de la ONU. Su rostro imita a la actriz Audrey Hepburn y su expresividad queda siempre un poco fuera de tiempo.'
    },
    {
      id: 'ameca', nombre: 'Ameca', obra: 'Engineered Arts',
      anio: 2021, cat: 'compania', img: 'assets/robots/ameca_engineeredarts.jpg', refRealismo: 80,
      dato: 'Su cara es de las más expresivas que existen (se encoge de hombros, guiña, se sorprende), pero el cuerpo es de plástico gris con juntas visibles. Esa mezcla —rostro muy humano + cuerpo claramente máquina— es el retrato de la disonancia.'
    },
    {
      id: 'geminoid', nombre: 'Geminoid HI', obra: 'Hiroshi Ishiguro / ATR',
      anio: 2006, cat: 'compania', img: 'assets/robots/geminoid_ishiguro.jpg', refRealismo: 93,
      dato: 'Es una copia del propio investigador Hiroshi Ishiguro, hecha con moldes de su cuerpo y su pelo real. En fotos junto a él hay que mirar dos veces para saber cuál es el humano. El experimento que más se acerca al otro lado del valle.'
    }
  ];

  /* Cada robot dispone de DOS vistas (principal y detalle), reencuadradas y
   * escaladas a ≤600×400 y centradas en el objeto (ver
   * scripts/reencuadrar-robots.sh). `img` se conserva como alias de la vista
   * principal para compatibilidad (ranking, exportaciones, etc.). */
  ROBOTS.forEach(r => {
    r.imgs = [r.img, r.img.replace(/\.jpg$/, '_detalle.jpg')];
  });

  /* ------------------------------------------------------------------ *
   * 2. LA CURVA
   * ------------------------------------------------------------------ *
   * Eje X = parecido con un humano (0 % = máquina, 100 % = persona).
   * Eje Y = aceptación: +1 familiar/agradable, 0 neutro, −1 profundamente
   *         incómodo ("el valle").
   */
  const CURVA_CONTROL = [
    [0.00, 0.55], [0.10, 0.78], [0.20, 0.88], [0.32, 0.62],
    [0.44, 0.20], [0.55, -0.25], [0.64, -0.60], [0.72, -0.82],
    [0.80, -0.66], [0.87, -0.36], [0.93, 0.02], [0.98, 0.45], [1.00, 0.62]
  ];
  const PUNTO_MAS_SINIESTRO = { x: 0.72, y: -0.82 }; // referencia del estudio

  function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t +
      (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
  }

  /** Muestrea la curva en `pasos` puntos: [{x,y}, ...] con x en 0..1. */
  function muestrearCurva(pasos) {
    pasos = pasos || 240;
    const P = CURVA_CONTROL;
    const segs = P.length - 1;
    const porSeg = Math.max(2, Math.round(pasos / segs));
    const out = [];
    for (let i = 0; i < segs; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let s = 0; s < porSeg; s++) out.push(catmullRom(p0, p1, p2, p3, s / porSeg));
    }
    out.push(P[P.length - 1].slice());
    return out.map(p => ({ x: p[0], y: p[1] }));
  }

  const MUESTRAS = muestrearCurva(260);

  /** Aceptación esperada (eje Y, −1..+1) para un parecido humano `x` (0..1). */
  function valleY(x) {
    x = Math.min(1, Math.max(0, x));
    let lo = 0, hi = MUESTRAS.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (MUESTRAS[mid].x <= x) lo = mid; else hi = mid;
    }
    const a = MUESTRAS[lo], b = MUESTRAS[hi];
    const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
    return a.y + (b.y - a.y) * t;
  }

  /** Punto de la curva más cercano a un punto cualquiera (para arrastrar). */
  function proyectarEnCurva(px, py) {
    let best = { x: 0, y: MUESTRAS[0].y, d: Infinity };
    for (let i = 0; i < MUESTRAS.length - 1; i++) {
      const a = MUESTRAS[i], b = MUESTRAS[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len2 = dx * dx + dy * dy;
      let t = len2 === 0 ? 0 : ((px - a.x) * dx + (py - a.y) * dy) / len2;
      t = Math.min(1, Math.max(0, t));
      const cx = a.x + t * dx, cy = a.y + t * dy;
      const d = (px - cx) * (px - cx) + (py - cy) * (py - cy);
      if (d < best.d) best = { x: cx, y: cy, d: d };
    }
    return best;
  }

  /** Convierte la aceptación (−1..1) en un índice 0–100 legible. */
  const indice = y => Math.round(50 + 50 * Math.min(1, Math.max(-1, y)));

  /** Etiqueta cualitativa para la aceptación. */
  function etiquetaAceptacion(y) {
    if (y >= 0.6) return { txt: 'Muy familiar', tono: 'pos' };
    if (y >= 0.2) return { txt: 'Simpático', tono: 'pos' };
    if (y >= -0.1) return { txt: 'Neutro', tono: 'neu' };
    if (y >= -0.4) return { txt: 'Inquietante', tono: 'neg' };
    if (y >= -0.68) return { txt: 'Perturbador', tono: 'neg' };
    return { txt: 'Profundamente siniestro', tono: 'neg' };
  }

  /* ------------------------------------------------------------------ *
   * 3. ESTADÍSTICA BÁSICA
   * ------------------------------------------------------------------ */
  const media = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
  const dt = a => {
    if (a.length < 2) return 0;
    const m = media(a);
    return Math.sqrt(a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1));
  };
  function pearson(a, b) {
    const n = Math.min(a.length, b.length);
    if (n < 3) return null;
    const ma = media(a.slice(0, n)), mb = media(b.slice(0, n));
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) {
      num += (a[i] - ma) * (b[i] - mb);
      da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2;
    }
    if (da === 0 || db === 0) return null;
    return num / Math.sqrt(da * db);
  }

  /* ------------------------------------------------------------------ *
   * 4. ANÁLISIS DE LA SESIÓN
   * ------------------------------------------------------------------ */
  function analizar(votos, sesionPrevia) {
    const items = votos
      .map(v => {
        const r = ROBOTS.find(x => x.id === v.id);
        if (!r) return null;
        const x = Math.min(1, Math.max(0, v.x / 100));
        const y = valleY(x);
        const refX = r.refRealismo / 100;
        return {
          id: r.id, nombre: r.nombre, obra: r.obra, anio: r.anio, cat: r.cat,
          img: r.img, dato: r.dato,
          x: x, y: y, indice: indice(y),
          refX: refX, refY: valleY(refX), refIndice: indice(valleY(refX)),
          confianza: (v.confianza === 0 || v.confianza === 1 || v.confianza === 2) ? v.confianza : null,
          conocido: v.conocido === true ? true : (v.conocido === false ? false : null),
          catNombre: CATEGORIAS[r.cat].nombre, catColor: CATEGORIAS[r.cat].color
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.x - b.x);

    if (!items.length) return null;

    const ys = items.map(i => i.y);
    const xs = items.map(i => i.x);
    const peor = items.reduce((m, i) => (i.y < m.y ? i : m), items[0]);
    const mejor = items.reduce((m, i) => (i.y > m.y ? i : m), items[0]);
    const peakRef = valleY(0.2);
    const profundidad = peakRef - peor.y;              // 0 .. ~1.7
    const mae = media(items.map(i => Math.abs(i.y - i.refY)));
    const maeX = media(items.map(i => Math.abs(i.x - i.refX)));
    const rY = pearson(ys, items.map(i => i.refY));

    const porCat = Object.keys(CATEGORIAS).map(k => {
      const g = items.filter(i => i.cat === k);
      return {
        id: k, nombre: CATEGORIAS[k].nombre, color: CATEGORIAS[k].color, n: g.length,
        y: media(g.map(i => i.y)), x: media(g.map(i => i.x)),
        indice: g.length ? indice(media(g.map(i => i.y))) : null
      };
    });

    const conConfianza = items.filter(i => i.confianza !== null);
    const trust = {
      n: conConfianza.length,
      si: conConfianza.filter(i => i.confianza === 2).length,
      quizas: conConfianza.filter(i => i.confianza === 1).length,
      no: conConfianza.filter(i => i.confianza === 0).length,
      ySid: media(conConfianza.filter(i => i.confianza === 2).map(i => i.y)),
      yNo: media(conConfianza.filter(i => i.confianza === 0).map(i => i.y)),
      r: pearson(conConfianza.map(i => i.y), conConfianza.map(i => i.confianza))
    };
    trust.tasa = trust.n ? Math.round(100 * (trust.si + 0.5 * trust.quizas) / trust.n) : null;

    const conocidos = items.filter(i => i.conocido === true);
    const noConocidos = items.filter(i => i.conocido === false);
    const familiaridad = {
      nConocidos: conocidos.length,
      nRespondidos: conocidos.length + noConocidos.length,
      yConocidos: conocidos.length ? media(conocidos.map(i => i.y)) : null,
      yNuevos: noConocidos.length ? media(noConocidos.map(i => i.y)) : null
    };

    const a = {
      items, n: items.length,
      mediaX: media(xs), mediaY: media(ys), sdY: dt(ys), sdX: dt(xs),
      indiceMedio: indice(media(ys)),
      aceptacion: Math.round(50 + 50 * media(ys)),
      peor, mejor, profundidad,
      profundidadIdx: Math.round(100 * Math.min(1, profundidad / 1.7)),
      xPeor: peor.x,
      ajuste: Math.round(100 * Math.max(0, 1 - mae / 1.5)),
      ajusteX: Math.round(100 * Math.max(0, 1 - maeX / 0.5)),
      rY, porCat, trust, familiaridad, mae, maeX,
      siniestros: items.slice().sort((p, q) => p.y - q.y).slice(0, 3),
      fiables: items.slice().sort((p, q) => q.y - p.y).slice(0, 3),
      hora: new Date().toISOString()
    };
    a.arquetipo = arquetipo(a);
    if (sesionPrevia && sesionPrevia.items && sesionPrevia.items.length) {
      a.comparacion = comparar(a, sesionPrevia);
    }
    return a;
  }

  function arquetipo(a) {
    const xp = a.xPeor, prof = a.profundidad;
    const sintoniaConEstudio = a.rY === null ? 0.5 : (a.rY + 1) / 2;
    let clave, titulo, lema;

    if (prof < 0.55) {
      clave = 'tolerante'; titulo = 'Valle casi imperceptible';
      lema = 'Casi ningún robot te produce rechazo.';
    } else if (prof < 1.0) {
      clave = 'moderado'; titulo = 'Valle moderado';
      lema = 'Notas la incomodidad, pero no te domina.';
    } else if (prof < 1.35) {
      clave = 'clasico'; titulo = 'Valle clásico';
      lema = 'Tu reacción dibuja la curva de Mori con bastante fidelidad.';
    } else {
      clave = 'profundo'; titulo = 'Valle profundo';
      lema = 'Los robots que rozan lo humano te producen un rechazo intenso.';
    }

    let zona;
    if (xp < 0.45) {
      zona = { clave: 'temprano', txt: 'temprano', desc: `Tu punto más incómodo aparece pronto (${Math.round(xp * 100)} % de parecido humano): te desagradan incluso los humanoides abiertamente mecánicos.` };
    } else if (xp <= 0.86) {
      zona = { clave: 'androide', txt: 'en la zona androide', desc: `Tu punto más incómodo cae en la zona androide (${Math.round(xp * 100)} % de parecido humano), exactamente donde los estudios sitúan el fondo del valle (≈72 %).` };
    } else {
      zona = { clave: 'tardio', txt: 'tardío', desc: `Tu punto más incómodo aparece muy tarde (${Math.round(xp * 100)} % de parecido humano): solo te perturban las imitaciones casi perfectas.` };
    }

    if (a.peor.y > -0.15) {
      zona = {
        clave: 'meseta', txt: 'meseta',
        desc: `Tu punto más bajo apareció en ${Math.round(xp * 100)} % de parecido humano, pero con una aceptación de ${a.peor.indice}/100: sigue siendo positiva. En tu caso no hubo valle, hubo una meseta.`
      };
    }

    if (a.porCat.filter(c => c.n).length >= 2) {
      const cats = a.porCat.filter(c => c.n);
      const mejorCat = cats.reduce((m, c) => (c.y > m.y ? c : m));
      const peorCat = cats.reduce((m, c) => (c.y < m.y ? c : m));
      zona.catMejor = mejorCat; zona.catPeor = peorCat;
      zona.brecha = mejorCat.y - peorCat.y;
    }
    zona.sintonia = sintoniaConEstudio;
    return { clave, titulo, lema, zona };
  }

  function comparar(actual, previa) {
    const mapa = {};
    previa.items.forEach(i => { mapa[i.id] = i; });
    const comunes = actual.items.filter(i => mapa[i.id]);
    if (!comunes.length) return null;
    const delta = comunes.map(i => ({ id: i.id, nombre: i.nombre, img: i.img, x: i.x, xPrevio: mapa[i.id].x, d: i.x - mapa[i.id].x }));
    delta.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
    return {
      fecha: previa.hora,
      nComunes: comunes.length,
      deltaMedioX: media(comunes.map(i => i.x - mapa[i.id].x)),
      cambioAceptacion: actual.indiceMedio - previa.indiceMedio,
      movimientos: delta.slice(0, 3).filter(d => Math.abs(d.d) > 0.04),
      repetidos: actual.items.filter(i => i.y < -0.4 && mapa[i.id] && mapa[i.id].y < -0.4).map(i => i.nombre),
      peorPrevio: previa.peor.nombre,
      peorPrevioY: previa.peor.y
    };
  }

  /* ------------------------------------------------------------------ *
   * 5. FEEDBACK EN TEXTO
   * ------------------------------------------------------------------ */
  const pct = v => Math.round(v * 100);
  const n1 = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
  const lista = nombres => nombres.length <= 1 ? nombres.join('') :
    nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];

  function feedback(a) {
    const arq = a.arquetipo, z = arq.zona;
    const s = [];
    const ref = PUNTO_MAS_SINIESTRO;

    s.push({
      titulo: 'Cómo leer tu resultado',
      html: `Cada robot que votaste se convirtió en un punto sobre la curva del valle: el eje horizontal es <b>cuánto se parece a un humano</b> y el vertical es <b>qué tan bien te cayó</b>. Arriba están los robots que te resultaron familiares o entrañables; abajo, los que te dieron escalofríos.<br><br>
      Tu perfil encaja con <b>${arq.titulo.toLowerCase()}</b>: ${arq.lema} Tu rechazo máximo fue de <b>${Math.round(a.profundidadIdx)} sobre 100</b> (la referencia del estudio llegaría a ~100) y tu aceptación media fue de <b>${a.aceptacion}/100</b>.`
    });

    s.push({
      titulo: 'Dónde está tu valle',
      html: `${z.desc}<br><br>
      Esto importa porque el fondo del valle tiene una ubicación teórica: Mori lo dibujó en 1970 y los estudios empíricos posteriores lo sitúan cerca del 70–75 % de parecido humano. ${
        z.clave === 'androide'
          ? 'Tu mínimo coincidió con esa franja: la "zona androide" es el lugar exacto donde el ojo humano no logra decidir si aquello está vivo o no.'
          : z.clave === 'temprano'
            ? 'Ahí estás por fuera de la franja esperada: a ti te basta una máquina con forma humana para sentir rechazo, aunque se note a la legua que es un robot.'
            : 'Ahí estás en el extremo: solo la imitación casi perfecta te inquieta, y por eso los androides son tu desafío, no los robots mecánicos.'
      }`
    });

    const sini = a.siniestros, fia = a.fiables;
    s.push({
      titulo: 'Lo que más te dio escalofríos',
      html: `Tus tres robots más incómodos fueron <b>${lista(sini.map(i => i.nombre))}</b> (${sini.map(i => i.indice + '/100').join(', ')}). Uno de ellos lo situaste a <b>${pct(sini[0].x)} %</b> de parecido humano.<br><br>
      Los estudios sobre percepción explican este malestar con dos mecanismos: la <i>ambigüedad de categoría</i> (el cerebro no sabe si clasificarlo como persona o como objeto y tarda más en decidir) y el <i>desajuste de realismo</i> (una piel impecable sobre unas manos metálicas, o al contrario). Fijate si alguno de tus votos bajó justo por eso: una parte del robot se ve muy humana y otra parte lo delata.`
    });

    s.push({
      titulo: 'Lo que te cayó bien',
      html: `En el lado luminoso quedaron <b>${lista(fia.map(i => i.nombre))}</b> (${fia.map(i => i.indice + '/100').join(', ')}). No hace falta que se parezcan a nosotros para caernos bien: basta con que su diseño sea <b>coherente</b>. Un cubo con ojos de binoculares o un gato robot redondo no prometen humanidad, y por eso no decepcionan.`
    });

    if (z.catMejor && z.catPeor && z.brecha !== undefined && Math.abs(z.brecha) > 0.02) {
      const brecha = z.brecha;
      s.push({
        titulo: 'Ficción frente a industria real',
        html: `Comparando categorías, tu categoría más "amable" fue <b>${z.catMejor.nombre}</b> (aceptación media ${z.catMejor.indice}/100) y la más incómoda <b>${z.catPeor.nombre}</b> (${z.catPeor.indice}/100), una brecha de ${Math.round(Math.abs(brecha) * 50)} puntos.<br><br>
        ${z.catPeor.id === 'compania'
          ? 'Es el resultado más frecuente y no es casual: los robots de cine y anime están <i>dibujados</i> para caer bien, mientras que los de las compañías reales intentan copiar el cuerpo humano y quedan atrapados a mitad de camino, justo en el fondo del valle.'
          : z.catPeor.id === 'anime'
            ? 'Tu patrón es poco común: los personajes de ficción te resultan más inquietantes que los robots reales. Puede ser por el estilo de dibujo o por lo que estos personajes representan en sus historias.'
            : 'Te resultaron más inquietantes los robots de ficción que los reales, algo poco frecuente: los androides de película suelen llevar el diseño al límite a propósito.'
        }`
      });
    }

    if (a.trust.n >= 4) {
      const t = a.trust;
      const relacion = (() => {
        if (t.ySid !== null && t.yNo !== null && t.si + t.no > 0) {
          if (t.ySid - t.yNo > 0.15) return 'Tus votos de agrado y tu confianza van en la misma dirección: los robots que te cayeron mejor son los mismos en los que confiarías.';
          if (t.yNo - t.ySid > 0.15) return 'Curiosamente, diste tu confianza a robots que no te agradaron: separás "me da mala espina" de "haría el trabajo bien".';
          return 'Tu agrado y tu confianza no siguen el mismo camino: son dos juicios distintos.';
        }
        return '';
      })();
      s.push({
        titulo: 'El valle y la confianza',
        html: `Aceptaste confiar (o confiar bajo supervisión) en el <b>${t.tasa} %</b> de los robots. ${relacion}<br><br>
        Este cruce es el hallazgo más citado del área: en un experimento con 80 rostros de robots reales, quienes caían en el valle no solo gustaban menos a los participantes, también recibían menos dinero en un juego de confianza. Es decir, el valle no es solo una cuestión estética: <b>cambia decisiones</b>.`
      });
    }

    if (a.familiaridad.nRespondidos >= 4 && a.familiaridad.nConocidos >= 1 && a.familiaridad.yNuevos !== null) {
      const d = a.familiaridad.yConocidos - a.familiaridad.yNuevos;
      s.push({
        titulo: 'Lo conocido y lo desconocido',
        html: `Reconociste <b>${a.familiaridad.nConocidos} de ${a.n}</b> robots. Los que ya conocías obtuvieron ${d > 0.08 ? 'una aceptación claramente mejor' : d < -0.08 ? 'una aceptación peor' : 'una aceptación parecida'} (${indice(a.familiaridad.yConocidos)} frente a ${indice(a.familiaridad.yNuevos)} sobre 100).<br><br>
        ${d > 0.08
          ? 'La familiaridad funciona como un escudo: la nostalgia y el recuerdo del personaje pesan más que su aspecto real. Varios estudios muestran que reconocer a un agente reduce la sensación de rareza.'
          : d < -0.08
            ? 'Aquí la familiaridad no te protegió: cuando ya tenías una expectativa clara del personaje, la imagen de robot te resultó más chocante. Esto suele pasar con personajes queridos transformados en máquina.'
            : 'En tu caso conocer o no al robot cambió poco: juzgaste la imagen, no el recuerdo.'
        }`
      });
    }

    if (a.comparacion) {
      const c = a.comparacion;
      const dir = c.cambioAceptacion > 3 ? 'más tolerante' : c.cambioAceptacion < -3 ? 'más severo' : 'igual de exigente';
      s.push({
        titulo: 'Comparado con tu sesión anterior',
        html: `En esta pasada fuiste <b>${dir}</b>: tu aceptación media ${c.cambioAceptacion >= 0 ? 'subió' : 'bajó'} ${Math.abs(c.cambioAceptacion)} puntos. ${
          c.movimientos.length
            ? 'Los robots que más movieron tu criterio fueron ' + lista(c.movimientos.map(m => `${m.nombre} (de ${pct(m.xPrevio)} a ${pct(m.x)} % de realismo percibido)`)) + '.'
            : 'Tus votos fueron notablemente estables entre las dos sesiones.'
        }${c.repetidos.length ? ` Se mantienen en el fondo del valle: ${lista(c.repetidos)}.` : ''}<br><br>
        Ojo: la segunda vez ya sabías qué venía, y eso también es un sesgo. La apariencia de un robot se juzga de forma distinta después de haberla visto una vez.`
      });
    }

    /* Cierre siempre presente */
    s.push({
      titulo: 'Para qué sirve todo esto',
      html: `El valle se usa hoy como argumento de diseño en robótica social, animación y videojuegos: si vas a construir algo muy parecido a una persona, o cruzas la frontera del realismo por completo o te quedas deliberadamente a este lado. Nada de mediastintas.<br><br>
      Pero el resultado más honesto de este simulador es que <b>la curva no está en el robot, está en quien mira</b>. Tu valle no está donde está el mío: ${
        a.n > 0 ? `tu punto de máxima incomodidad apareció en ${pct(a.xPeor)} % de parecido humano` : ''
      }, y varios estudios recientes incluso describen <i>dos</i> valles: uno con los robots apenas humanoides y otro con los casi perfectos. Cada cultura, cada edad y cada persona tiene su propio mapa.`
    });

    return s;
  }

  const REFERENCIAS = [
    { txt: 'Mori, M. (1970). "The Uncanny Valley" (Bukimi no tani), Energy, 7(4).', url: 'https://spectrum.ieee.org/the-uncanny-valley' },
    { txt: 'MacDorman, K. F. & Ishiguro, H. (2006). "The uncanny advantage of using androids in cognitive and social science research". Interaction Studies, 7(3).', url: 'http://www.macdorman.com/kfm/writings/pubs/MacDorman2006AndroidScience.pdf' },
    { txt: 'Mathur, M. B. & Reichling, D. B. (2016). "Navigating a social world with robot partners: a quantitative cartography of the Uncanny Valley". Cognition, 146, 22–32.', url: 'https://pubmed.ncbi.nlm.nih.gov/26402646/' },
    { txt: 'Kim, B., de Visser, E. J. & Phillips, E. (2022). "Two uncanny valleys: Re-evaluating the uncanny valley across the full spectrum of real-world human-like robots". Computers in Human Behavior, 135.', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0747563222001625' }
  ];

  /* Créditos de las imágenes: procedencia divulgada para cada robot. */
  const CREDITOS = [
    { txt: 'Maria de Metropolis, C-3PO, WALL·E, T-800, Ava, Astro Boy, Doraemon, Gundam, Motoko, 2B: fotogramas, pósteres y figuras pertenecientes a sus respectivas productoras y licenciantes (UFA, Lucasfilm/Disney, Pixar/Disney, StudioCanal, A24/Film4, Tezuka Productions, Shogakukan, Bandai Namco, Producción I.G, Square Enix).' },
    { txt: 'ASIMO: Honda Motor Co. · Pepper: SoftBank Robotics · Spot: Boston Dynamics (foto IEEE Spectrum) · Sophia: Hanson Robotics · Ameca: Engineered Arts · Geminoid HI: Hiroshi Ishiguro / ATR (foto vía robotsguide.com).' },
    { txt: 'Cada robot se muestra con dos vistas (principal y detalle) reencuadradas y escaladas a 600×400 o menos, centradas en el objeto, mediante scripts/reencuadrar-robots.sh.' },
    { txt: 'Las vistas de WALL·E, T‑800, Gundam RX‑78‑2 y 2B se regeneraron porque los recortes originales cortaban la cabeza o el cuerpo del robot; las demás proceden de las fuentes anteriores.' },
    { txt: 'Las imágenes se incluyen con fines educativos y de divulgación, sin ánimo de lucro. Todas las marcas y personajes pertenecen a sus dueños.' }
  ];

  /* ------------------------------------------------------------------ *
   * 6. EXPORTACIÓN
   * ------------------------------------------------------------------ */
  function aCSV(a) {
    const filas = [
      ['orden_por_realismo', 'robot_id', 'nombre', 'obra', 'categoria', 'anio',
        'realismo_percibido_%', 'aceptacion_sobre_100', 'confianza', 'ya_lo_conocia',
        'realismo_referencia_%', 'aceptacion_referencia_sobre_100']
    ];
    a.items.forEach((i, n) => {
      const conf = i.confianza === null ? '' : i.confianza === 2 ? 'si' : i.confianza === 1 ? 'con_supervision' : 'no';
      const con = i.conocido === null ? '' : (i.conocido ? 'si' : 'no');
      filas.push([n + 1, i.id, i.nombre, i.obra, i.catNombre, i.anio,
        Math.round(i.x * 100), i.indice, conf, con,
        i.refRealismo || Math.round(i.refX * 100), i.refIndice]);
    });
    return filas.map(f => f.map(c => {
      const s = String(c);
      return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
  }

  function resumenTexto(a) {
    const arq = a.arquetipo;
    const L = [];
    L.push('EL VALLE DE LO SINIESTRO — mis resultados');
    L.push(new Date(a.hora).toLocaleString('es-CO'));
    L.push('');
    L.push('Perfil: ' + arq.titulo + ' (' + arq.lema + ')');
    L.push('Aceptación media: ' + a.aceptacion + '/100');
    L.push('Punto más siniestro: ' + a.peor.nombre + ' a ' + pct(a.xPeor) + '% de parecido humano (índice ' + a.peor.indice + '/100)');
    L.push('Coincidencia con la curva de referencia: ' + a.ajuste + '%');
    if (a.trust.tasa !== null) L.push('Tasa de confianza: ' + a.trust.tasa + '% de los robots');
    L.push('');
    L.push('Votos (de más mecánico a más humano):');
    a.items.forEach((i, n) => {
      L.push('  ' + (n + 1) + '. ' + i.nombre.padEnd(28, ' ') + ' realismo ' + String(pct(i.x)).padStart(3) + '%   aceptación ' + String(i.indice).padStart(3) + '/100');
    });
    L.push('');
    L.push('Categorías:');
    a.porCat.filter(c => c.n).forEach(c => {
      L.push('  ' + c.nombre.padEnd(18, ' ') + ' aceptación media ' + c.indice + '/100');
    });
    return L.join('\n');
  }

  return {
    CATEGORIAS, ROBOTS, CURVA_CONTROL, PUNTO_MAS_SINIESTRO, MUESTRAS, REFERENCIAS, CREDITOS,
    muestrearCurva, valleY, proyectarEnCurva, indice, etiquetaAceptacion,
    analizar, feedback, aCSV, resumenTexto,
    _internos: { media, dt, pearson, arquetipo, comparar }
  };
});
