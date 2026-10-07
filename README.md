# El Valle de lo Siniestro — Simulador

Aplicación web estática en español para explorar dilemas de interacción humano-máquina en salud. No necesita un servidor ni un proceso de compilación; las respuestas permanecen en el navegador.

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
