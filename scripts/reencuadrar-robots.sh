#!/usr/bin/env bash
# ============================================================================
# reencuadrar-robots.sh — reencuadre y escalado del catálogo de robots
# ----------------------------------------------------------------------------
# Por cada robot produce DOS vistas centradas en el objeto y con tamaño
# igual o inferior a 600×400:
#
#   · vista principal  → assets/robots/<slug>.jpg
#   · vista de detalle → assets/robots/<slug>_detalle.jpg
#
# Las fuentes viven en assets/robots/originales/. Los recortes se definen en
# PORCENTAJES del ancho/alto de cada fuente (tabla CROP de más abajo), de modo
# que el script no depende de la resolución de origen. Tras el recorte se aplica
# `-resize 600x400>`, que solo REDUCE: ninguna vista final supera 600×400 y
# jamás se amplía un recorte (no se inventa resolución).
#
# Uso:  bash scripts/reencuadrar-robots.sh
# Requiere ImageMagick (convert / identify).
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=assets/robots/originales
OUT=assets/robots
MAXW=600
MAXH=400

command -v convert  >/dev/null || { echo "falta ImageMagick (convert)"  >&2; exit 1; }
command -v identify >/dev/null || { echo "falta ImageMagick (identify)" >&2; exit 1; }

# ----------------------------------------------------------------------------
# Tabla de recortes (porcentajes: X Y ANCHO ALTO sobre la fuente).
#   principal = encuadre que centra el robot completo o su zona dominante
#   detalle   = primer plano (cara / rasgo distintivo)
# ----------------------------------------------------------------------------
declare -A PRINC DET
PRINC[maria_metropolis]="23 0 60 56";        DET[maria_metropolis]="30 0 42 40"
PRINC[c3po_starwars]="29 5 44 91";           DET[c3po_starwars]="30 8 42 43"
PRINC[walle_pixar]="26 12 48 80";            DET[walle_pixar]="40 13 23 42"
PRINC[t800_terminator]="28 2 44 95";         DET[t800_terminator]="38 4 24 36"
PRINC[gundam_rx78]="33 4 36 92";             DET[gundam_rx78]="40 5 22 35"
PRINC[nier2b_automata]="24 2 40 95";         DET[nier2b_automata]="44 3 16 40"
PRINC[ava_exmachina]="0 36 26 64";           DET[ava_exmachina]="0 36 22 40"
PRINC[astroboy_anime]="60 1 40 97";          DET[astroboy_anime]="68 3 32 35"
PRINC[doraemon_anime]="23 37 60 53";         DET[doraemon_anime]="30 40 44 42"
PRINC[motoko_gits]="14 19 60 64";            DET[motoko_gits]="20 24 48 53"
PRINC[asimo_honda]="26 3 48 93";             DET[asimo_honda]="38 1 40 40"
PRINC[pepper_softbank]="29 8 42 85";         DET[pepper_softbank]="42 26 29 30"
PRINC[spot_bostondynamics]="0 8 75 80";      DET[spot_bostondynamics]="4 34 60 42"
PRINC[sophia_hanson]="25 0 50 66";           DET[sophia_hanson]="36 0 32 32"
PRINC[ameca_engineeredarts]="22 24 60 53";   DET[ameca_engineeredarts]="39 32 30 32"
PRINC[geminoid_ishiguro]="0 3 100 53";       DET[geminoid_ishiguro]="52 10 48 42"

# Ajustes puntuales de revelado (p. ej. fotogramas oscuros).
declare -A ADJ
ADJ[motoko_gits]="-modulate 130,100 -brightness-contrast 4x12"

# ----------------------------------------------------------------------------
crop_view() { # $1=slug  $2=tabla(PRINC|DET)  $3=archivo-salida
  local slug=$1 vista=$2 out=$3
  local src="$SRC/$slug.jpg"
  local dims; dims=$(identify -format '%w %h' "$src")
  local W=${dims%% *} H=${dims##* }
  local -a g=(${vista})
  local px=$(( W * g[2] / 100 )) py=$(( H * g[3] / 100 ))
  local ox=$(( W * g[0] / 100 )) oy=$(( H * g[1] / 100 ))
  # recorta el sobrante si el recorte se sale del lienzo
  if (( ox + px > W )); then px=$(( W - ox )); fi
  if (( oy + py > H )); then py=$(( H - oy )); fi
  # shellcheck disable=SC2086
  convert "$src" -crop "${px}x${py}+${ox}+${oy}" +repage ${ADJ[$slug]:-} \
          -resize "${MAXW}x${MAXH}>" -strip -quality 82 -interlace JPEG "$out"
}

for slug in "${!PRINC[@]}"; do
  crop_view "$slug" "${PRINC[$slug]}" "$OUT/$slug.jpg"
  crop_view "$slug" "${DET[$slug]}"   "$OUT/${slug}_detalle.jpg"
  echo "ok $slug"
done

# ----------------------------------------------------------------------------
# Verificación: ninguna vista final puede superar 600×400.
# ----------------------------------------------------------------------------
fail=0
while read -r f geo; do
  w=${geo%%x*}; h=${geo##*x}
  if (( w > MAXW || h > MAXH )); then echo "ERROR: $f mide $geo" >&2; fail=1; fi
done < <(identify -format '%f %wx%h\n' "$OUT"/*.jpg)
if (( fail )); then exit 1; fi
echo "Todas las vistas finales quedan ≤ ${MAXW}×${MAXH}."
