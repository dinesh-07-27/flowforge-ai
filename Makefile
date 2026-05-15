.PHONY: help up down build logs migrate worker test clean

help:
	@echo "FlowForge AI — Available Commands"
	@echo "=================================="
	@echo "  make up       - Start all services"
	@echo "  make down     - Stop all services"
	@echo "  make build    - Rebuild all Docker images"
	@echo "  make logs     - Tail logs from all services"
	@echo "  make migrate  - Run Alembic DB migrations"
	@echo "  make worker   - Show Celery worker logs"
	@echo "  make test     - Run all tests"
	@echo "  make clean    - Remove all containers and volumes"

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose up -d --build

logs:
	docker-compose logs -f

migrate:
	docker-compose exec api alembic upgrade head

worker:
	docker-compose logs -f worker

test:
	docker-compose exec api pytest -v

clean:
	docker-compose down -v --remove-orphans
