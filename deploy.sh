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

echo "-> Verificando existencia de ${REMOTE_ENV_FILE} en ${EVOLOOTION_REMOTE_USER}@${EVOLOOTION_REMOTE_HOST}..."
if ssh -o BatchMode=yes "${EVOLOOTION_REMOTE_USER}@${EVOLOOTION_REMOTE_HOST}" \
  REMOTE_ENV_FILE="${REMOTE_ENV_FILE}" 'test -f "${REMOTE_ENV_FILE}"'; then
  echo "-> Fichero ${REMOTE_ENV_FILE} encontrado en el servidor remoto."
  HAS_REMOTE_ENV="true"
else
  echo "-> No se encontró ${REMOTE_ENV_FILE} en el servidor remoto."
  HAS_REMOTE_ENV="false"
  prompt_required EVOLOOTION_HOST_SUBDOMAIN "Introduce el subdominio del host (EVOLOOTION_HOST_SUBDOMAIN)"
  prompt_required HOST_BASE "Introduce el dominio base (HOST_BASE)"
fi

echo "============================================================"
echo " Desplegando EvoLootIon en ${EVOLOOTION_REMOTE_USER}@${EVOLOOTION_REMOTE_HOST}"
echo " Ruta remota : ${EVOLOOTION_REMOTE_PATH}"
echo " Rama        : ${BRANCH}"
echo "============================================================"

ssh -o BatchMode=yes "${EVOLOOTION_REMOTE_USER}@${EVOLOOTION_REMOTE_HOST}" \
  EVOLOOTION_REMOTE_PATH="${EVOLOOTION_REMOTE_PATH}" \
  REMOTE_ENV_FILE="${REMOTE_ENV_FILE}" \
  HAS_REMOTE_ENV="${HAS_REMOTE_ENV}" \
  EVOLOOTION_HOST_SUBDOMAIN="${EVOLOOTION_HOST_SUBDOMAIN}" \
  HOST_BASE="${HOST_BASE}" \
  BRANCH="${BRANCH}" 'bash -s' <<'EOF'
set -euo pipefail

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
