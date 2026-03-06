#!/usr/bin/env bash
# ============================================================================
# Request Access Workflow – Setup & Start Script
# ============================================================================
# Usage:
#   ./setup-request-access.sh            # Install, seed, start backend + frontend
#   ./setup-request-access.sh backend    # Start only the backend
#   ./setup-request-access.sh frontend   # Start only the frontend
#   ./setup-request-access.sh docker     # Start everything via Docker Compose
#   ./setup-request-access.sh install    # Only install dependencies (no start)
#   ./setup-request-access.sh seed       # Only seed demo data (no start)
# ============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/request-access-backend"
FRONTEND_DIR="$ROOT_DIR/request-access-frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ── Pre-flight checks ──────────────────────────────────────────────────────
check_python() {
    if command -v python3 &>/dev/null; then
        PYTHON=python3
    elif command -v python &>/dev/null; then
        PYTHON=python
    else
        err "Python 3 not found. Please install Python 3.10+."
        exit 1
    fi
    info "Using $($PYTHON --version)"
}

check_node() {
    if ! command -v node &>/dev/null; then
        err "Node.js not found. Please install Node.js 18+."
        exit 1
    fi
    info "Using Node $(node --version)"
}

check_docker() {
    if ! command -v docker &>/dev/null; then
        err "Docker not found. Please install Docker."
        exit 1
    fi
    if ! docker compose version &>/dev/null && ! command -v docker-compose &>/dev/null; then
        err "Docker Compose not found."
        exit 1
    fi
    info "Using $(docker --version)"
}

# ── Install backend dependencies ───────────────────────────────────────────
install_backend() {
    info "Setting up backend..."
    cd "$BACKEND_DIR"

    # Create venv if it doesn't exist
    if [ ! -d ".venv" ]; then
        info "Creating Python virtual environment..."
        $PYTHON -m venv .venv
    fi

    # Activate venv
    source .venv/bin/activate

    info "Installing Python dependencies..."
    pip install -q -r requirements.txt

    ok "Backend dependencies installed."
    cd "$ROOT_DIR"
}

# ── Install frontend dependencies ──────────────────────────────────────────
install_frontend() {
    info "Setting up frontend..."
    cd "$FRONTEND_DIR"

    info "Installing npm packages..."
    npm install --silent 2>/dev/null || npm install

    ok "Frontend dependencies installed."
    cd "$ROOT_DIR"
}

# ── Seed demo data ─────────────────────────────────────────────────────────
seed_data() {
    info "Seeding demo data..."
    cd "$BACKEND_DIR"
    source .venv/bin/activate
    $PYTHON seed_demo_data.py
    ok "Demo data ready."
    cd "$ROOT_DIR"
}

# ── Start backend ──────────────────────────────────────────────────────────
start_backend() {
    install_backend
    seed_data
    info "Starting backend on http://localhost:8000 ..."
    info "  API docs:  http://localhost:8000/docs"
    info "  Health:    http://localhost:8000/health"
    echo ""
    cd "$BACKEND_DIR"
    source .venv/bin/activate
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

# ── Start frontend ─────────────────────────────────────────────────────────
start_frontend() {
    install_frontend
    info "Starting frontend on http://localhost:3000 ..."
    echo ""
    cd "$FRONTEND_DIR"
    npx vite --host 0.0.0.0
}

# ── Start both (dev mode) ─────────────────────────────────────────────────
start_both() {
    install_backend
    install_frontend
    seed_data

    echo ""
    info "========================================="
    info "  Starting Backend + Frontend (dev mode)"
    info "========================================="
    info "  Backend:   http://localhost:8000"
    info "  API docs:  http://localhost:8000/docs"
    info "  Frontend:  http://localhost:3000"
    echo ""
    info "  Press Ctrl+C to stop both."
    echo ""

    # Start backend in background
    cd "$BACKEND_DIR"
    source .venv/bin/activate
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!

    # Wait for backend to be ready
    info "Waiting for backend..."
    for i in $(seq 1 10); do
        if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
            ok "Backend is up!"
            break
        fi
        sleep 1
    done

    # Start frontend
    cd "$FRONTEND_DIR"
    npx vite --host 0.0.0.0 &
    FRONTEND_PID=$!

    # Cleanup on exit
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; ok 'Stopped.'" EXIT INT TERM
    wait
}

# ── Docker Compose mode ───────────────────────────────────────────────────
start_docker() {
    check_docker
    info "Starting with Docker Compose..."
    cd "$ROOT_DIR"

    COMPOSE_CMD="docker compose"
    if ! docker compose version &>/dev/null; then
        COMPOSE_CMD="docker-compose"
    fi

    $COMPOSE_CMD -f docker-compose.request-access.yml up --build
}

# ── Main ───────────────────────────────────────────────────────────────────
MODE="${1:-both}"

case "$MODE" in
    backend)
        check_python
        start_backend
        ;;
    frontend)
        check_node
        start_frontend
        ;;
    docker)
        start_docker
        ;;
    install)
        check_python
        check_node
        install_backend
        install_frontend
        ok "All dependencies installed. Run ./setup-request-access.sh to start."
        ;;
    seed)
        check_python
        install_backend
        seed_data
        ;;
    both|"")
        check_python
        check_node
        start_both
        ;;
    *)
        err "Unknown mode: $MODE"
        echo "Usage: $0 [backend|frontend|docker|install|seed|both]"
        exit 1
        ;;
esac
