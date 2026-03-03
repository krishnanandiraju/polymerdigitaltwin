# =============================================================================
# Manufacturing Digital Twin — Makefile
# =============================================================================
.PHONY: demo demo-stop demo-status install install-backend install-frontend help

SHELL := /bin/bash

## Start the demo (backend + frontend in background)
demo:
	@bash scripts/demo/start.sh

## Stop the demo
demo-stop:
	@bash scripts/demo/stop.sh

## Show demo status and URLs
demo-status:
	@bash scripts/demo/status.sh

## Install all dependencies (Python + Node)
install: install-backend install-frontend

install-backend:
	@echo "📦  Installing Python dependencies…"
	@pip install -r backend/requirements.txt

install-frontend:
	@echo "📦  Installing Node dependencies…"
	@cd frontend && npm install

## Print this help
help:
	@echo ""
	@echo "  Manufacturing Digital Twin"
	@echo ""
	@echo "  make demo          Start backend + frontend (background)"
	@echo "  make demo-stop     Stop both servers"
	@echo "  make demo-status   Show running status + URLs"
	@echo "  make install       Install Python + Node dependencies"
	@echo ""
