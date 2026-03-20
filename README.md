# Laundry Microservices Platform

A Spring Boot microservices backend for a laundry management system, built as part of the CTSE assignment. The platform exposes a single API Gateway entry point and uses gRPC for inter-service communication.

---

## Architecture Overview

```
                         ┌─────────────────────────────────────────────┐
                         │              API Gateway :8080               │
                         │          (Spring Cloud Gateway)              │
                         └──────┬──────────┬───────────┬───────────────┘
                                │          │           │           │
                         /api/auth  /api/customers  /api/orders  /api/payments
                                │          │           │           │
                    ┌───────────┘    ┌─────┘     ┌────┘     ┌────┘
                    ▼                ▼            ▼          ▼
             ┌──────────┐   ┌──────────────┐ ┌────────┐ ┌─────────┐
             │   auth   │   │   customer    │ │ order  │ │ payment │
             │ :8084    │   │   :8086      │ │ :8082  │ │  :8083  │
             │ gRPC:9094│   │   gRPC:9096  │ │        │ │         │
             └────┬─────┘   └──────┬───────┘ └───┬────┘ └────┬────┘
                  │                │  gRPC         │ gRPC      │
                  │                └──────────────►│           │
                  │                               gRPC         │
                  │                               customer ──►  │
                  │                                            │
                  └──────────────────────────────────────────►│ (token validation)
                                                               │
                         ┌────────────────────────────────────┘
                         ▼
                  ┌─────────────┐
                  │  PostgreSQL │
                  │    :5432    │
                  │  authdb     │
                  │  customer_db  │
                  │  orderdb    │
                  │  paymentdb  │
                  └─────────────┘
```

### gRPC communication
| Caller | Callee | Purpose |
|---|---|---|
| `order-service` | `customer-service` (`:9096`) | Resolve item prices at order creation |
| `payment-service` | `order-service` | Update order status after payment |
| Any service | `auth-service` (`:9094`) | Validate JWT tokens without HTTP round-trips |

---

## Modules

| Module | Type | Description |
|---|---|---|
| `common` | Library JAR | Shared `ApiResponse<T>`, exceptions, `GlobalExceptionHandler` |
| `grpc-lib` | Library JAR | Proto definitions + generated gRPC stubs |
| `auth-service` | Spring Boot App | User registration, login, JWT issuance & validation |
| `customer-service` | Spring Boot App | Customer profiles, addresses, order history, preferences |
| `order-service` | Spring Boot App | Order lifecycle management |
| `payment-service` | Spring Boot App | Payment processing |
| `gateway` | Spring Boot App | API Gateway — single entry point |

---

## Tech Stack

- **Java 21** · **Spring Boot 3.2.3** · **Spring Cloud 2023.0.0**
- **Spring Security** + **JJWT 0.12** for authentication
- **gRPC 1.62** + **Protobuf 3.25** for inter-service communication
- **Spring Data JPA** + **PostgreSQL 16**
- **Docker** + **Docker Compose**

---

## Prerequisites

| Tool | Version |
|---|---|
| JDK | 21+ |
| Maven | 3.9+ |
| Docker | 24+ |
| Docker Compose | v2+ |

---

## Project Structure

```
ctse-assignment/
├── docker-compose.yml
├── docker/
│   └── postgres/
│       └── init.sql            # Creates all four databases on first run
└── backend/
    ├── pom.xml                 # Parent POM
    ├── common/                 # Shared library
    │   └── src/main/java/com/ctse/common/
    │       ├── response/       # ApiResponse<T>
    │       ├── exception/      # ServiceException hierarchy
    │       ├── handler/        # GlobalExceptionHandler
    │       └── config/         # Spring Boot auto-configuration
    ├── grpc-lib/               # Protobuf definitions & generated stubs
    │   └── src/main/proto/
    │       ├── auth_service.proto
    │       ├── customer_service.proto
    │       └── order_service.proto
    ├── auth-service/
    ├── customer-service/
    ├── order-service/
    ├── payment-service/
    └── gateway/
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd ctse-assignment
```

### 2. Build all modules

```bash
cd backend
./mvnw clean install -DskipTests
```

> The `grpc-lib` build step downloads the `protoc` binary for your OS automatically and generates Java stubs from the `.proto` files.

### 3. Run with Docker Compose

```bash
# from project root
docker compose up --build
```

The first run will:
1. Start PostgreSQL and execute `docker/postgres/init.sql` to create all four databases.
2. Build and start all five application services.

### 4. Run services locally (without Docker)

Start PostgreSQL locally (or via Docker standalone):

```bash
docker run -d \
  --name postgres \
  -e POSTGRES_USER=ctse \
  -e POSTGRES_PASSWORD=ctse_password \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

Then run each service from its directory:

```bash
cd backend
./mvnw -pl auth-service    spring-boot:run
./mvnw -pl customer-service spring-boot:run
./mvnw -pl order-service   spring-boot:run
./mvnw -pl payment-service spring-boot:run
./mvnw -pl gateway         spring-boot:run
```

---

## Service Endpoints

All requests go through the gateway at `http://localhost:8080`.

### Auth Service — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login and receive a JWT |
| `GET` | `/api/auth/me` | Bearer token | Get current user profile |

**Register request:**
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Login response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "token": "<jwt>",
    "tokenType": "Bearer",
    "userId": "...",
    "username": "john",
    "email": "john@example.com",
    "roles": ["ROLE_USER"]
  },
  "timestamp": "2026-03-03T10:00:00Z"
}
```

### Customer Service — `/api/customers`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/customers` | List all prices (optional `?serviceType=`) |
| `GET` | `/api/customers/{id}` | Get price entry by ID |
| `GET` | `/api/customers/calculate?serviceType=&itemType=&quantity=` | Calculate total price |
| `POST` | `/api/customers` | Create price entry |
| `PUT` | `/api/customers/{id}` | Update price entry |
| `DELETE` | `/api/customers/{id}` | Delete price entry |

**Create price entry request:**
```json
{
  "serviceType": "WASH",
  "itemType": "SHIRT",
  "unitPrice": 2.50,
  "currency": "USD"
}
```

### Order Service — `/api/orders`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/{id}` | Get order by ID |
| `POST` | `/api/orders` | Create a new order |
| `PUT` | `/api/orders/{id}` | Update order |
| `DELETE` | `/api/orders/{id}` | Cancel order |

### Payment Service — `/api/payments`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/payments` | List all payments |
| `GET` | `/api/payments/{id}` | Get payment by ID |
| `POST` | `/api/payments` | Process a payment |

---

## API Response Format

All endpoints return a consistent envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": { },
  "timestamp": "2026-03-03T10:00:00.000Z"
}
```

Error responses:

```json
{
  "success": false,
  "message": "CustomerProfile with id '99' not found",
  "timestamp": "2026-03-03T10:00:00.000Z"
}
```

---

## Environment Variables

Each service reads the following environment variables (with defaults for local development):

| Variable | Default | Used by |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/<service>db` | All services |
| `DB_USERNAME` | `ctse` | All services |
| `DB_PASSWORD` | `ctse_password` | All services |
| `JWT_SECRET` | Base64 dev secret | `auth-service` |
| `CUSTOMER_SERVICE_GRPC_HOST` | `localhost` | `order-service` |
| `CUSTOMER_SERVICE_GRPC_PORT` | `9096` | `order-service` |
| `ORDER_SERVICE_GRPC_HOST` | `localhost` | `payment-service` |
| `AUTH_SERVICE_URL` | `http://localhost:8084` | `gateway` |
| `CUSTOMER_SERVICE_URL` | `http://localhost:8086` | `gateway` |
| `ORDER_SERVICE_URL` | `http://localhost:8082` | `gateway` |
| `PAYMENT_SERVICE_URL` | `http://localhost:8083` | `gateway` |

> **Production note:** replace `JWT_SECRET` with a 256-bit Base64-encoded secret and `DB_PASSWORD` with a strong password. Never commit real secrets to version control.

---

## Port Reference

| Container | HTTP | gRPC |
|---|---|---|
| `gateway` | 8080 | — |
| `auth-service` | 8084 | 9094 |
| `customer-service` | 8086 | 9096 |
| `order-service` | 8082 | — |
| `payment-service` | 8083 | — |
| `postgres` | 5432 | — |

---

## Common Module

The `common` module is auto-configured — add it as a Maven dependency and the `GlobalExceptionHandler` activates automatically with no extra `@Import` needed.

**Exception types:**

| Class | HTTP Status |
|---|---|
| `ResourceNotFoundException` | 404 Not Found |
| `BadRequestException` | 400 Bad Request |
| `ConflictException` | 409 Conflict |
| `UnauthorizedException` | 401 Unauthorized |
| `ForbiddenException` | 403 Forbidden |

---

## gRPC Proto Files

Located in `backend/grpc-lib/src/main/proto/`:

| File | Service | Methods |
|---|---|---|
| `auth_service.proto` | `AuthService` | `ValidateToken`, `GetUser` |
| `customer_service.proto` | `CustomerService` | `GetPrice`, `GetAllPrices` |
| `order_service.proto` | `OrderService` | `UpdateOrderStatus`, `GetOrderSummary` |

Stubs are generated automatically during `mvn compile` via `protobuf-maven-plugin`.

---

## Running Tests

```bash
cd backend
./mvnw test
```

---

## Useful Docker Commands

```bash
# Start all services
docker compose up -d

# View logs for a specific service
docker compose logs -f auth-service

# Stop and remove containers (keeps DB volume)
docker compose down

# Stop and wipe everything including the database volume
docker compose down -v

# Rebuild a single service after code changes
docker compose up -d --build customer-service
```
