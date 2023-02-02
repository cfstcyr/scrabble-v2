dev-clientless dev-c:
	docker compose -f docker-compose.dev-clientless.yml up -d
	cd packages/client && \
	npm start
	
dev:
	docker compose -f docker-compose.dev.yml up --attach server --attach client

dev-detached dev-d:
	docker compose -f docker-compose.dev.yml up -d

dev-build dev-b:
	docker compose -f docker-compose.dev.yml up --build --attach server --attach client

dev-build-detached dev-bd:
	docker compose -f docker-compose.dev.yml up --build -d

prod:
	docker compose -f docker-compose.yml up --build -d