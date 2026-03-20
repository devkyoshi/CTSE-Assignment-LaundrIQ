# AGENTS.md — AI Coding Agent Guide for Laundry Microservices Platform

## Big Picture Architecture
- **Spring Boot microservices** for laundry management: `auth-service`, `customer-service`, `order-service`, `payment-service`, and `gateway` (API Gateway).
- **gRPC** is used for inter-service communication (see `backend/grpc-lib/src/main/proto/`).
- **PostgreSQL** is used for persistence; each service has its own database.
- All HTTP requests flow through the `gateway` at `http://localhost:8080`.

## Service Boundaries & Data Flows
- **Auth Service**: Handles user registration, login, JWT issuance/validation. Other services validate tokens via gRPC (`ValidateToken`).
- **Customer Service**: Manages customer profiles, addresses, order history, and preferences.
- **Order Service**: Manages order lifecycle. `payment-service` updates order status via gRPC after payment.
- **Payment Service**: Handles payment processing.
- **Gateway**: Routes all HTTP API traffic to backend services.

## Critical Developer Workflows
- **Build all modules**: `cd backend; ./mvnw clean install -DskipTests`
- **Run all services (Docker Compose)**: `docker compose up --build`
- **Run services locally**: Start PostgreSQL, then run each service with `./mvnw -pl <service> spring-boot:run`
- **Run tests**: `cd backend; ./mvnw test`
- **Rebuild a single service**: `docker compose up -d --build <service>`
- **View logs**: `docker compose logs -f <service>`

## Project-Specific Conventions
- **Unified API Response**: All endpoints return `ApiResponse<T>` (see `common/response/ApiResponse.java`).
- **Global Exception Handling**: All services use `common/handler/GlobalExceptionHandler.java` for consistent error envelopes.
- **gRPC Proto Files**: Located in `backend/grpc-lib/src/main/proto/`; Java stubs generated automatically.
- **Environment Variables**: Each service reads DB and service URLs from env vars (see README for details).
- **No manual @Import needed**: `common` module auto-configures exception handler via Spring Boot imports.

## Integration Points & Patterns
- **gRPC calls**:
  - `payment-service` → `order-service`: order status update
  - Any service → `auth-service`: token validation
- **API Gateway**: All HTTP endpoints are routed via `gateway`.
- **Database Initialization**: `docker/postgres/init.sql` creates all databases on first run.

## Key Files & Directories
- `backend/common/response/ApiResponse.java`: API response envelope
- `backend/common/handler/GlobalExceptionHandler.java`: error handling
- `backend/grpc-lib/src/main/proto/`: gRPC proto definitions
- `docker-compose.yml`: service orchestration
- `docker/postgres/init.sql`: DB setup
- `backend/<service>/resources/application.properties.example`: service config templates

## Examples
- **API Response**:
  ```json
  {
    "success": true,
    "message": "Success",
    "data": { ... },
    "timestamp": "2026-03-03T10:00:00.000Z"
  }
  ```
- **gRPC ValidateTokenRequest** (see `auth_service.proto`):
  ```proto
  message ValidateTokenRequest {
    string token = 1;
  }
  ```

---
For more, see `README.md` and proto files in `grpc-lib`.

