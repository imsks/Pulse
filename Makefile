# Pulse - Development Makefile
# Quick commands for fast development workflow

.PHONY: dev dev-up dev-down dev-logs dev-clean dev-rebuild help

# Start development environment
dev: dev-up

# Start all services
dev-up:
	docker-compose -f docker-compose.dev.yml up --build

# Start in detached mode
dev-up-d:
	docker-compose -f docker-compose.dev.yml up -d --build

# Stop all services
dev-down:
	docker-compose -f docker-compose.dev.yml down

# View logs (follow)
dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

# View logs for specific service
dev-logs-api:
	docker-compose -f docker-compose.dev.yml logs -f pulse-api

dev-logs-worker:
	docker-compose -f docker-compose.dev.yml logs -f pulse-worker

# Clean everything (containers, volumes, networks)
dev-clean:
	docker-compose -f docker-compose.dev.yml down -v
	docker volume prune -f

# Rebuild from scratch
dev-rebuild:
	docker-compose -f docker-compose.dev.yml build --no-cache
	docker-compose -f docker-compose.dev.yml up

# Restart a specific service (faster than full restart)
dev-restart-api:
	docker-compose -f docker-compose.dev.yml restart pulse-api

dev-restart-worker:
	docker-compose -f docker-compose.dev.yml restart pulse-worker

# Execute command in running container
dev-exec-api:
	docker-compose -f docker-compose.dev.yml exec pulse-api sh

dev-exec-worker:
	docker-compose -f docker-compose.dev.yml exec pulse-worker sh

# Help
help:
	@echo "Pulse Development Commands:"
	@echo "  make dev              - Start dev environment"
	@echo "  make dev-up           - Start all services"
	@echo "  make dev-up-d         - Start in detached mode"
	@echo "  make dev-down         - Stop all services"
	@echo "  make dev-logs         - View all logs"
	@echo "  make dev-logs-api     - View API logs"
	@echo "  make dev-logs-worker  - View worker logs"
	@echo "  make dev-clean        - Clean everything"
	@echo "  make dev-rebuild      - Rebuild from scratch"
	@echo "  make dev-restart-api  - Restart API only"
	@echo "  make dev-restart-worker - Restart worker only"

