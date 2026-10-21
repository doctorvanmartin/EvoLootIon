#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Remoto — EvoLootIon
# Conecta por SSH (sin contraseña, mediante clave pública), descarga los últimos
# cambios de la rama 'main' y reconstruye/relanza el contenedor con Docker Compose.
# ==============================================================================

set -euo pipefail

BRANCH="main"
EVOLOOTION_REMOTE_USER="${EVOLOOTION_REMOTE_USER:-}"
EVOLOOTION_REMOTE_HOST="${EVOLOOTION_REMOTE_HOST:-}"
EVOLOOTION_REMOTE_PATH="${EVOLOOTION_REMOTE_PATH:-}"
EVOLOOTION_HOST_SUBDOMAIN="${EVOLOOTION_HOST_SUBDOMAIN:-}"
HOST_BASE="${HOST_BASE:-}"

usage() {
  cat <<EOF
Uso: $0 [opciones]

Opciones:
  -u, --user <usuario>         Usuario SSH del servidor remoto (var: EVOLOOTION_REMOTE_USER)
  -h, --host <servidor>        Host o IP del servidor remoto (var: EVOLOOTION_REMOTE_HOST)
  -p, --path <ruta>            Ruta del repositorio en el servidor remoto (var: EVOLOOTION_REMOTE_PATH)
  -s, --subdomain <subdominio> Subdominio del servicio (var: EVOLOOTION_HOST_SUBDOMAIN)
  -b, --base-host <dominio>    Dominio base (var: HOST_BASE)
  --help                       Muestra esta ayuda

Si las variables de entorno no están definidas ni se pasan por parámetros, el
script las solicitará de forma interactiva (sin valores por defecto).
EOF
}

prompt_required() {
  local var_name="$1"
  local prompt_text="$2"
  local current_val="${!var_name:-}"

  while [[ -z "${current_val}" ]]; do
    read -r -p "${prompt_text}: " current_val
    if [[ -z "${current_val}" ]]; then
      echo "Por favor, introduce un valor válido (no puede estar vacío)." >&2
    fi
  done

  printf -v "${var_name}" '%s' "${current_val}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--user)
      EVOLOOTION_REMOTE_USER="$2"
      shift 2
      ;;
    -h|--host)
      EVOLOOTION_REMOTE_HOST="$2"
      shift 2
      ;;
    -p|--path)
      EVOLOOTION_REMOTE_PATH="$2"
      shift 2
      ;;
    -s|--subdomain)
      EVOLOOTION_HOST_SUBDOMAIN="$2"
      shift 2
      ;;
    -b|--base-host)
      HOST_BASE="$2"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Error: Opción desconocida '$1'" >&2
      usage
      exit 1
      ;;
  esac
done

# Solicitar parámetros de conexión si no están definidos en el entorno ni por CLI
prompt_required EVOLOOTION_REMOTE_USER "Introduce el usuario SSH remoto (EVOLOOTION_REMOTE_USER)"
prompt_required EVOLOOTION_REMOTE_HOST "Introduce el host/IP remoto (EVOLOOTION_REMOTE_HOST)"
prompt_required EVOLOOTION_REMOTE_PATH "Introduce la ruta remota del repositorio (EVOLOOTION_REMOTE_PATH)"

REMOTE_ENV_FILE="${EVOLOOTION_REMOTE_PATH%/}/../.env"

# Función auxiliar para escapar un argumento de forma segura para cualquier shell remoto (incluyendo fish)
escape_remote_arg() {
  local val="${1:-}"
  printf "'%s'" "${val//\'/\'\\\'\'}"
}

echo "-> Verificando existencia y variables de ${REMOTE_ENV_FILE} en ${EVOLOOTION_REMOTE_USER}@${EVOLOOTION_REMOTE_HOST}..."
REMOTE_ENV_STATUS="$(
  ssh -o BatchMode=yes "${EVOLOOTION_REMOTE_USER}@${EVOLOOTION_REMOTE_HOST}" \
    "bash -s -- $(escape_remote_arg "${REMOTE_ENV_FILE}")" <<'EOF'
set -euo pipefail
ENV_FILE="$1"
if [ ! -f "${ENV_FILE}" ]; then
  echo "FILE_EXISTS=false"
  echo "HAS_SUBDOMAIN=false"
  echo "HAS_BASE=false"
  exit 0
fi

echo "FILE_EXISTS=true"
if grep -Eq '^[[:space:]]*(export[[:space:]]+)?EVOLOOTION_HOST_SUBDOMAIN=[^[:space:]#]+' "${ENV_FILE}"; then
  echo "HAS_SUBDOMAIN=true"
else
  echo "HAS_SUBDOMAIN=false"
fi

if grep -Eq '^[[:space:]]*(export[[:space:]]+)?HOST_BASE=[^[:space:]#]+' "${ENV_FILE}"; then
  echo "HAS_BASE=true"
else
  echo "HAS_BASE=false"
fi
EOF
)"

HAS_REMOTE_ENV="false"
HAS_REMOTE_SUBDOMAIN="false"
HAS_REMOTE_BASE="false"

while IFS='=' read -r key val; do
  case "${key}" in
    FILE_EXISTS) HAS_REMOTE_ENV="${val}" ;;
    HAS_SUBDOMAIN) HAS_REMOTE_SUBDOMAIN="${val}" ;;
    HAS_BASE) HAS_REMOTE_BASE="${val}" ;;
  esac
done <<< "${REMOTE_ENV_STATUS}"

APPEND_SUBDOMAIN="false"
APPEND_BASE="false"

if [ "${HAS_REMOTE_ENV}" = "true" ]; then
  echo "-> Fichero ${REMOTE_ENV_FILE} encontrado en el servidor remoto."
  if [ "${HAS_REMOTE_SUBDOMAIN}" != "true" ]; then
    echo "-> La variable EVOLOOTION_HOST_SUBDOMAIN no está definida en ${REMOTE_ENV_FILE}."
    prompt_required EVOLOOTION_HOST_SUBDOMAIN "Introduce el subdominio del host (EVOLOOTION_HOST_SUBDOMAIN)"
    APPEND_SUBDOMAIN="true"
  fi
  if [ "${HAS_REMOTE_BASE}" != "true" ]; then
    echo "-> La variable HOST_BASE no está definida en ${REMOTE_ENV_FILE}."
    prompt_required HOST_BASE "Introduce el dominio base (HOST_BASE)"
    APPEND_BASE="true"
  fi

  if [ "${APPEND_SUBDOMAIN}" = "true" ] || [ "${APPEND_BASE}" = "true" ]; then
    echo "-> Añadiendo las variables faltantes al final de ${REMOTE_ENV_FILE}..."
    ssh -o BatchMode=yes "${EVOLOOTION_REMOTE_USER}@${EVOLOOTION_REMOTE_HOST}" \
      "bash -s -- $(escape_remote_arg "${REMOTE_ENV_FILE}") $(escape_remote_arg "${APPEND_SUBDOMAIN}") $(escape_remote_arg "${EVOLOOTION_HOST_SUBDOMAIN}") $(escape_remote_arg "${APPEND_BASE}") $(escape_remote_arg "${HOST_BASE}")" <<'EOF'
set -euo pipefail
ENV_FILE="$1"
ADD_SUB="$2"
VAL_SUB="$3"
ADD_BASE="$4"
VAL_BASE="$5"

# Asegurar salto de línea final antes de añadir nuevas variables
if [ -s "${ENV_FILE}" ] && [ "$(tail -c 1 "${ENV_FILE}" | wc -l)" -eq 0 ]; then
  echo "" >> "${ENV_FILE}"
fi

if [ "${ADD_SUB}" = "true" ]; then
  echo "EVOLOOTION_HOST_SUBDOMAIN=${VAL_SUB}" >> "${ENV_FILE}"
fi

if [ "${ADD_BASE}" = "true" ]; then
  echo "HOST_BASE=${VAL_BASE}" >> "${ENV_FILE}"
fi
EOF
    echo "-> Variables guardadas correctamente en ${REMOTE_ENV_FILE}."
  fi
else
  echo "-> No se encontró ${REMOTE_ENV_FILE} en el servidor remoto."
  prompt_required EVOLOOTION_HOST_SUBDOMAIN "Introduce el subdominio del host (EVOLOOTION_HOST_SUBDOMAIN)"
  prompt_required HOST_BASE "Introduce el dominio base (HOST_BASE)"
fi

echo "============================================================"
echo " Desplegando EvoLootIon en ${EVOLOOTION_REMOTE_USER}@${EVOLOOTION_REMOTE_HOST}"
echo " Ruta remota : ${EVOLOOTION_REMOTE_PATH}"
echo " Rama        : ${BRANCH}"
echo "============================================================"

ssh -o BatchMode=yes "${EVOLOOTION_REMOTE_USER}@${EVOLOOTION_REMOTE_HOST}" \
  "bash -s -- $(escape_remote_arg "${EVOLOOTION_REMOTE_PATH}") $(escape_remote_arg "${REMOTE_ENV_FILE}") $(escape_remote_arg "${HAS_REMOTE_ENV}") $(escape_remote_arg "${EVOLOOTION_HOST_SUBDOMAIN}") $(escape_remote_arg "${HOST_BASE}") $(escape_remote_arg "${BRANCH}")" <<'EOF'
set -euo pipefail

EVOLOOTION_REMOTE_PATH="$1"
REMOTE_ENV_FILE="$2"
HAS_REMOTE_ENV="$3"
EVOLOOTION_HOST_SUBDOMAIN="$4"
HOST_BASE="$5"
BRANCH="$6"

if [ ! -d "${EVOLOOTION_REMOTE_PATH}/.git" ]; then
  echo "Error: No se encontró un repositorio Git en '${EVOLOOTION_REMOTE_PATH}'." >&2
  echo "Clona primero el repositorio en esa ruta dentro del servidor remoto." >&2
  exit 1
fi

cd "${EVOLOOTION_REMOTE_PATH}"

echo "-> [1/3] Obteniendo los últimos cambios del repositorio (origin/${BRANCH})..."
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git reset --hard "origin/${BRANCH}"

echo "-> [2/3] Reconstruyendo y relanzando el contenedor con Docker Compose..."
if [ "${HAS_REMOTE_ENV}" = "true" ]; then
  docker compose --env-file "${REMOTE_ENV_FILE}" up -d --build --remove-orphans
  echo "-> [3/3] Estado actual del contenedor:"
  docker compose --env-file "${REMOTE_ENV_FILE}" ps
else
  export EVOLOOTION_HOST_SUBDOMAIN="${EVOLOOTION_HOST_SUBDOMAIN}"
  export HOST_BASE="${HOST_BASE}"
  docker compose up -d --build --remove-orphans
  echo "-> [3/3] Estado actual del contenedor:"
  docker compose ps
fi
EOF

echo "============================================================"
echo " Despliegue completado con éxito."
echo "============================================================"
