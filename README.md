# El Valle de lo Siniestro — Simulador

Dos experiencias web estáticas en español, sin servidor ni proceso de compilación. Todo lo que responde el usuario permanece en su navegador.

| Página | Qué es |
| --- | --- |
| `index.html` | **Simulador de dilemas clínicos.** Siete escenarios de interacción humano‑máquina en salud, en modo individual o grupal (hasta 5 personas). |
| `valle-de-los-robots.html` | **El Valle de los Robots.** Recorrido por 16 robots de cine, anime y compañías reales para votar, imagen por imagen, la curva del *uncanny valley* y recibir un perfil personal con análisis. |

La segunda se abre desde la portada del simulador y también admite enlace directo.

## El Valle de los Robots

- **16 robots** en tres categorías: cine y TV (Maria de *Metropolis*, C‑3PO, WALL·E, T‑800, Ava), anime y manga (Astro Boy, Doraemon, Gundam RX‑78‑2, Motoko Kusanagi, 2B) y compañías reales (ASIMO, Pepper, Spot, Sophia, Ameca, Geminoid HI de Ishiguro).
- **Voto único sobre la curva:** se arrastra un marcador a lo largo de la curva de Mori (o se usan las flechas del teclado, o la barra de ajuste fino). La altura es la sensación que el robot provoca; la posición horizontal, el parecido humano percibido.
- **Dos vistas anónimas primero** (principal y detalle, ≤600×400 y centradas en el robot), ficha con contexto y comparación con la referencia del estudio después de cada voto.
- **Resultado final:** perfil («valle profundo», «valle tardío», «meseta»…), gráfico con los 16 votos, comparación por categorías, cruce entre agrado y confianza, y comparación con la sesión anterior. Todo con referencias citadas.
- **Votos solo en el navegador** (`localStorage`), con exportación a CSV o resumen de texto y opción de borrado.
- Accesible por teclado y compatible con `prefers-reduced-motion`.

El catálogo, la curva y el análisis viven en `assets/valle-core.js`, sin dependencias y testeable con Node (`require('./assets/valle-core.js')`). Cada robot cuenta con dos vistas (principal y detalle) reencuadradas y escaladas a 600×400 o menos, centradas en el objeto: las finales viven en `assets/robots/`, las fuentes en `assets/robots/originales/` y el proceso es reproducible con `bash scripts/reencuadrar-robots.sh` (requiere ImageMagick). La procedencia de las imágenes se detalla en la sección «Imágenes» de la propia página.

## Publicar en GitHub Pages

1. En el repositorio, abre **Settings → Pages** y selecciona **GitHub Actions** como *Build and deployment source*.
2. Integra los cambios en `main` o ejecuta manualmente el workflow **Deploy GitHub Pages** desde la pestaña **Actions**.
3. Cuando el workflow termine, encontrarás la URL del sitio en el entorno **github-pages** o en **Settings → Pages**.

El archivo `index.html` es la página de entrada requerida por GitHub Pages. El antiguo enlace `simulador_valle_siniestro.html` redirige a esa página.

## Probar localmente

Desde la raíz del repositorio, ejecuta:

```sh
python3 -m http.server 8000
```

Luego abre <http://localhost:8000>.
