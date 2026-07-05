#!/usr/bin/env bash
# docker/build.sh
# Builds all language runner images required by CodeSandboxer in Docker mode.
#
# Usage:
#   bash docker/build.sh            # build all images
#   bash docker/build.sh --no-cache # force full rebuild

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

NO_CACHE=""
if [[ "${1:-}" == "--no-cache" ]]; then
  NO_CACHE="--no-cache"
  echo "[build] Cache disabled."
fi

echo "[build] Building language runner Docker images..."
echo "[build] Project root: ${PROJECT_ROOT}"
echo ""

build_image() {
  local name="$1"
  local context="$2"
  echo "------------------------------------------------------------"
  echo "[build] Building image: ${name}"
  echo "[build] Context:        ${context}"
  echo "------------------------------------------------------------"
  docker build ${NO_CACHE} -t "${name}" "${context}"
  echo "[build] ✓ ${name} built successfully."
  echo ""
}

build_image "codebattle-python" "${PROJECT_ROOT}/docker/images/python"
build_image "codebattle-node"   "${PROJECT_ROOT}/docker/images/node"
build_image "codebattle-java"   "${PROJECT_ROOT}/docker/images/java"

echo "============================================================"
echo "[build] All images built successfully."
echo ""
echo "  codebattle-python  (Python 3.9)"
echo "  codebattle-node    (Node.js 18)"
echo "  codebattle-java    (Java 17 JDK)"
echo ""
echo "  Run the service:  docker-compose up --build"
echo "============================================================"
