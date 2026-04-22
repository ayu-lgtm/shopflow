# ShopFlow — Microservice E-Commerce Platform

> **Full-stack microservice project** built with Spring Boot 3, React, Kafka, Docker, and JWT authentication.  
> Deployed live on free platforms: Render.com + Netlify + RedpandaCloud

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Project Structure](#4-project-structure)
5. [Features](#5-features)
6. [API Endpoints](#6-api-endpoints)
7. [JWT Auth Flow](#7-jwt-auth-flow)
8. [Local Setup](#8-local-setup)
9. [Deployment Guide](#9-deployment-guide)
10. [Known Issues & Fixes](#10-known-issues--fixes)
11. [Test Credentials](#11-test-credentials)

---

## 1. Project Overview

ShopFlow is a **microservice-based e-commerce backend** with a React frontend. It demonstrates:

- **Service Discovery** via Eureka — services find each other dynamically
- **API Gateway** — single entry point with JWT verification and RBAC
- **Synchronous communication** via Feign Client (Product → User validation)
- **Asynchronous communication** via Kafka (User events → Product service)
- **JWT-based authentication** with role-based access control (ADMIN / USER)
- **Containerized deployment** using Docker

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | Spring Boot 3.x |
| Service Discovery | Netflix Eureka |
| API Gateway | Spring Cloud Gateway |
| Inter-service Sync | OpenFeign |
| Inter-service Async | Apache Kafka |
| Database | H2 (in-memory) |
| Authentication | JWT (HS384, shared secret) |
| Frontend | React 18 + Redux Toolkit |
| HTTP Client | Axios |
| Routing | React Router v6 |
| Containerization | Docker + Docker Buildx |
| Deployment — Backend | Render.com |
| Deployment — Frontend | Netlify |
| Kafka Cloud | RedpandaCloud (Serverless) |

---

## 3. Architecture

> 📊 [Interactive Architecture Diagram](link-to-deployed-diagram)

### High-Level Flow

```
[User Browser]
      │
      │ HTTPS
      ▼
[Netlify — React Frontend :3000]
      │
      │ REST API calls
      ▼
[API Gateway :8080]  ──── JWT verify + RBAC
      │                   Role extraction
      │                   Header injection (X-User-Email, X-User-Role)
      │
      │ Load balanced via Eureka
      ├──────────────────────┐
      ▼                      ▼
[User Service :8081]   [Product Service :8082]
      │                      │
      │ Kafka publish         │ Kafka consume
      └──────────────────────┘
             (user-events topic)
      │
      │ Feign Client (sync)
      └──▶ Product → validates user via User Service
```

### Service Communication

```
SYNC  (Feign):   Product Service ──▶ User Service
                 "Is this user valid?"

ASYNC (Kafka):   User Service ──▶ [user-events topic] ──▶ Product Service
                 "New user registered: {email, name}"
```

### Eureka Service Discovery

```
All services register themselves at startup:
  ┌─────────────────────────────────────┐
  │         Eureka Server :8761         │
  │  ┌─────────────────────────────┐    │
  │  │ Registered Services:        │    │
  │  │  API-GATEWAY      → UP      │    │
  │  │  USER-SERVICE     → UP      │    │
  │  │  PRODUCT-SERVICE  → UP      │    │
  │  └─────────────────────────────┘    │
  └─────────────────────────────────────┘
Gateway routes requests using service names (lb://user-service)
instead of hardcoded IPs — auto load balancing.
```

---

## 4. Project Structure

```
shopflow/
├── eureka-server/                    ← Service Discovery (port 8761)
│   ├── src/main/java/.../EurekaServerApplication.java
│   ├── src/main/resources/application.yml
│   ├── Dockerfile
│   └── pom.xml
│
├── api-gateway/                      ← Entry point + JWT auth (port 8080)
│   ├── src/main/java/.../config/
│   │   └── SecurityConfig.java       ← JWT verify, RBAC rules, header injection
│   ├── src/main/resources/application.yml
│   ├── Dockerfile
│   └── pom.xml
│
├── user-service/                     ← Register/Login/Profile (port 8081)
│   ├── src/main/java/.../
│   │   ├── controller/UserController.java
│   │   ├── service/UserService.java   ← JWT generation, admin seed
│   │   ├── config/JwtUtil.java        ← JWT sign/verify
│   │   ├── config/KafkaEventPublisher.java
│   │   ├── model/User.java
│   │   └── repository/UserRepository.java
│   ├── src/main/resources/application.yml
│   ├── Dockerfile
│   └── pom.xml
│
├── product-service/                  ← Products CRUD (port 8082)
│   ├── src/main/java/.../
│   │   ├── controller/ProductController.java
│   │   ├── service/ProductService.java
│   │   ├── kafka/UserEventConsumer.java  ← Listens to user-events topic
│   │   ├── config/UserServiceClient.java ← Feign client → user-service
│   │   ├── model/Product.java
│   │   └── repository/ProductRepository.java
│   ├── src/main/resources/application.yml
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                         ← React + Redux (port 3000)
│   ├── src/
│   │   ├── App.js                    ← Routes + AdminRoute guard
│   │   ├── store/index.js            ← Redux slices, axios interceptors
│   │   ├── components/Navbar.js      ← Role-aware navbar
│   │   └── pages/
│   │       ├── LoginPage.js
│   │       ├── RegisterPage.js
│   │       ├── HomePage.js
│   │       ├── ProductsPage.js
│   │       ├── DashboardPage.js
│   │       └── AdminPage.js          ← Admin only
│   ├── public/
│   │   ├── index.html
│   │   └── _redirects               ← Netlify React Router fix
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml               ← Local full stack setup
├── ShopFlow_JWT_Postman_Collection.json
└── README.md
```

---

## 5. Features

### Authentication & Authorization
- User registration with hashed passwords
- JWT login — token contains `email`, `role`, `expiry`
- Role-based access: `ROLE_ADMIN` and `ROLE_USER`
- Auto-seeded admin user on startup
- 401/403 auto-logout in frontend via Axios interceptor

### API Gateway (Security Layer)
- Validates JWT signature on every request
- Extracts `role` claim → maps to Spring Security Authority
- Injects `X-User-Email` and `X-User-Role` headers into downstream requests
- RBAC rules:
  - `GET /api/products` → public
  - `POST /api/products` → ADMIN only
  - `PUT/DELETE /api/products/**` → ADMIN only
  - `GET /api/users/all` → ADMIN only
  - `GET /api/users/profile` → any authenticated user

### User Service
- Register new users
- Login → returns JWT token
- Profile endpoint (uses gateway-injected header)
- Publishes Kafka event on registration
- Admin user seeded via `@PostConstruct`

### Product Service
- Full CRUD for products
- Validates user via Feign sync call to user-service
- Consumes Kafka events from user-service
- Pre-loaded sample products via `DataInitializer`

### Frontend
- Role-aware UI — Admin sees extra buttons/pages, User does not
- Admin badge in Navbar for admin users
- Admin Panel page — view all registered users
- Protected routes via `AdminRoute` component
- Responsive design with CSS

---

## 6. API Endpoints

All requests go through API Gateway: `http://localhost:8080`

### Auth (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login → returns JWT token |

### Users (Protected)
| Method | Endpoint | Auth Required | Role |
|--------|----------|--------------|------|
| GET | `/api/users/profile` | Yes | Any |
| GET | `/api/users/all` | Yes | ADMIN |
| GET | `/api/users/health` | No | Public |

### Products
| Method | Endpoint | Auth Required | Role |
|--------|----------|--------------|------|
| GET | `/api/products` | No | Public |
| GET | `/api/products/{id}` | No | Public |
| POST | `/api/products` | Yes | ADMIN |
| PUT | `/api/products/{id}` | Yes | ADMIN |
| DELETE | `/api/products/{id}` | Yes | ADMIN |

### Infrastructure
| URL | Description |
|-----|-------------|
| `http://localhost:8761` | Eureka Dashboard |
| `http://localhost:8081/h2-console` | User DB (H2 Console) |
| `http://localhost:8082/h2-console` | Product DB (H2 Console) |

---

## 7. JWT Auth Flow

```
1. User sends POST /api/users/login
         │
         ▼
2. User Service validates credentials
   Generates JWT:
   {
     "sub": "user@email.com",
     "role": "ADMIN",
     "exp": 1234567890
   }
   Signed with HS384 + shared secret
         │
         ▼
3. Frontend stores token in localStorage
   Axios interceptor auto-adds:
   Authorization: Bearer <token>
         │
         ▼
4. API Gateway receives next request
   a. Validates JWT signature
   b. Extracts role → ROLE_ADMIN or ROLE_USER
   c. Checks RBAC rules (hasAuthority)
   d. Injects X-User-Email + X-User-Role into downstream request
         │
         ▼
5. User/Product Service receives request
   No re-validation needed
   Uses X-User-Email for Feign calls + audit trail
```

---

## 8. Local Setup

### Prerequisites

**macOS:**
```bash
brew install openjdk@17 maven
# Install Docker Desktop from docker.com
```

**Windows (PowerShell as Admin):**
```powershell
choco install microsoft-openjdk17 maven -y
# Install Docker Desktop from docker.com
```

Verify:
```bash
java --version   # 17.x
mvn --version    # 3.x
docker --version # 24.x+
```

---

### Option A — Docker Compose (Recommended, Easiest)

```bash
cd shopflow

# Step 1: Build all JARs

# macOS — run separately (chaining && unreliable on mac)
cd eureka-server   && mvn clean package -DskipTests && cd ..
cd api-gateway     && mvn clean package -DskipTests && cd ..
cd user-service    && mvn clean package -DskipTests && cd ..
cd product-service && mvn clean package -DskipTests && cd ..

# Windows PowerShell
cd eureka-server; mvn clean package -DskipTests; cd ..
cd api-gateway; mvn clean package -DskipTests; cd ..
cd user-service; mvn clean package -DskipTests; cd ..
cd product-service; mvn clean package -DskipTests; cd ..

# Step 2: Start everything
docker-compose up --build

# Step 3: Open in browser
# Frontend:       http://localhost:3000
# Eureka:         http://localhost:8761
# Gateway:        http://localhost:8080
# User H2 DB:     http://localhost:8081/h2-console
# Product H2 DB:  http://localhost:8082/h2-console
```

H2 Console settings:
```
JDBC URL:  jdbc:h2:mem:userdb   (or productdb for product service)
Username:  sa
Password:  (leave blank)
```

---

### Option B — Run Services Separately (Best for Learning)

```bash
# Terminal 1 — Start Kafka + Zookeeper
docker-compose up zookeeper kafka -d
# Wait 30 seconds for Kafka to be ready

# Terminal 2 — Eureka Server
cd eureka-server
mvn spring-boot:run
# Open http://localhost:8761

# Terminal 3 — User Service
cd user-service
mvn spring-boot:run
# Test: http://localhost:8081/api/users/health

# Terminal 4 — Product Service
cd product-service
mvn spring-boot:run
# Test: http://localhost:8082/api/products

# Terminal 5 — API Gateway
cd api-gateway
mvn spring-boot:run
# All requests via: http://localhost:8080

# Terminal 6 — Frontend
cd frontend
npm install
npm start
# Open http://localhost:3000
```

---

### Option C — Backend Only (Postman/curl)

```bash
# Start everything via docker-compose first
docker-compose up --build -d

# Register a user
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Login as admin
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shopflow.com","password":"admin123"}'
# Copy the token from response

export TOKEN="eyJhbGci..."

# Get all products (public)
curl http://localhost:8080/api/products

# Create product (admin only)
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Laptop","description":"Gaming laptop","price":999.99,"stock":10,"category":"Electronics"}'
```

Import `ShopFlow_JWT_Postman_Collection.json` in Postman for full test suite.

---

## 9. Deployment Guide

**Live deployment on free platforms:**
- Backend → Render.com (Docker-based)
- Frontend → Netlify (Static hosting)
- Kafka → RedpandaCloud (Serverless free tier)

### Prerequisites Check

**macOS:**
```bash
brew install openjdk@17 maven
# Docker Desktop must be running
```

**Windows:**
```powershell
choco install microsoft-openjdk17 maven -y
# Docker Desktop must be running
```

---

### Step 1 — Build JAR Files

**macOS — run each separately:**
```bash
cd shopflow

cd eureka-server
mvn clean package -DskipTests
cd ..

cd api-gateway
mvn clean package -DskipTests
cd ..

cd user-service
mvn clean package -DskipTests
cd ..

cd product-service
mvn clean package -DskipTests
cd ..
```

**Windows PowerShell:**
```powershell
cd shopflow
cd eureka-server; mvn clean package -DskipTests; cd ..
cd api-gateway; mvn clean package -DskipTests; cd ..
cd user-service; mvn clean package -DskipTests; cd ..
cd product-service; mvn clean package -DskipTests; cd ..
```

---

### Step 2 — Push Docker Images to Docker Hub

Create free account at **hub.docker.com**

```bash
docker login
```

**macOS (Intel + Apple Silicon — always use buildx):**
```bash
export DOCKERHUB_USER=your-dockerhub-username

docker buildx build --platform linux/amd64 \
  -t $DOCKERHUB_USER/shopflow-eureka:latest --push ./eureka-server

docker buildx build --platform linux/amd64 \
  -t $DOCKERHUB_USER/shopflow-gateway:latest --push ./api-gateway

docker buildx build --platform linux/amd64 \
  -t $DOCKERHUB_USER/shopflow-user:latest --push ./user-service

docker buildx build --platform linux/amd64 \
  -t $DOCKERHUB_USER/shopflow-product:latest --push ./product-service

docker buildx build --platform linux/amd64 \
  -t $DOCKERHUB_USER/shopflow-frontend:latest --push ./frontend
```

**Windows PowerShell:**
```powershell
$env:DOCKERHUB_USER = "your-dockerhub-username"

docker buildx build --platform linux/amd64 `
  -t $env:DOCKERHUB_USER/shopflow-eureka:latest --push ./eureka-server

docker buildx build --platform linux/amd64 `
  -t $env:DOCKERHUB_USER/shopflow-gateway:latest --push ./api-gateway

docker buildx build --platform linux/amd64 `
  -t $env:DOCKERHUB_USER/shopflow-user:latest --push ./user-service

docker buildx build --platform linux/amd64 `
  -t $env:DOCKERHUB_USER/shopflow-product:latest --push ./product-service

docker buildx build --platform linux/amd64 `
  -t $env:DOCKERHUB_USER/shopflow-frontend:latest --push ./frontend
```

After pushing — go to Docker Hub → each repo → Settings → set **Public**.

---

### Step 3 — Setup Kafka on RedpandaCloud

1. Go to **cloud.redpanda.com** → Sign up → Create **Serverless** cluster
2. Cluster → **Overview** → copy Bootstrap Server URL
3. Cluster → **Security** → Create user: `shopflow` → save password
4. **ACLs** → Give `shopflow` user access to all topics
5. **Topics** → Create topic: `user-events`

---

### Step 4 — Deploy on Render.com

Sign up at **render.com** with GitHub.

**Deploy in this exact order: Eureka → User → Product → Gateway**

#### Eureka Server
- New → Web Service → Deploy existing image
- Image: `docker.io/YOUR_USERNAME/shopflow-eureka:latest`
- Port: `8761` | Instance: Free
- Env: `JAVA_OPTS = -Xmx256m -Xms128m`
- Wait for **Live** status → copy URL

#### User Service
- Image: `docker.io/YOUR_USERNAME/shopflow-user:latest`
- Port: `8081` | Instance: Free
- Environment Variables:

```
EUREKA_URL                                      = https://shopflow-eureka.onrender.com/eureka/
KAFKA_URL                                       = your-bootstrap-url:9092
SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL       = SASL_SSL
SPRING_KAFKA_PROPERTIES_SASL_MECHANISM          = SCRAM-SHA-256
SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG        = org.apache.kafka.common.security.scram.ScramLoginModule required username="shopflow" password="YOUR_KAFKA_PASSWORD";
DB_URL                                          = jdbc:h2:mem:userdb
DB_USER                                         = sa
DB_PASS                                         =
DB_DRIVER                                       = org.h2.Driver
HIBERNATE_DIALECT                               = org.hibernate.dialect.H2Dialect
JWT_SECRET                                      = shopflow-super-secret-key-must-be-256-bits-long!
JAVA_OPTS                                       = -Xmx256m -Xms128m
```

#### Product Service
- Image: `docker.io/YOUR_USERNAME/shopflow-product:latest`
- Port: `8082` | Instance: Free
- Same env vars as User Service but:
  - `DB_URL = jdbc:h2:mem:productdb`
  - No `JWT_SECRET` needed

#### API Gateway
- Image: `docker.io/YOUR_USERNAME/shopflow-gateway:latest`
- Port: `8080` | Instance: Free
- Environment Variables:

```
EUREKA_URL  = https://shopflow-eureka.onrender.com/eureka/
JWT_SECRET  = shopflow-super-secret-key-must-be-256-bits-long!
JAVA_OPTS   = -Xmx256m -Xms128m
```

After all 4 deploy — open Eureka dashboard and verify all 3 services show **UP**.

---

### Step 5 — Deploy Frontend on Netlify

**Push to GitHub first:**
```bash
cd shopflow

# Fix submodule issue (run always before first push)
git rm --cached frontend 2>/dev/null || true
rm -rf frontend/.git
rm -f .gitmodules

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/shopflow.git
git push -u origin main
```

**Netlify setup:**
1. **netlify.com** → Add new site → Import from GitHub
2. Build settings:

| Field | Value |
|-------|-------|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `build` |

3. Environment variable:
   ```
   REACT_APP_API_URL = https://shopflow-gateway.onrender.com
   ```
4. Deploy

---

### Step 6 — Keep Services Alive (UptimeRobot)

Render free tier sleeps after 15 min. Fix with free pings:

1. **uptimerobot.com** → Sign up → Add New Monitor (HTTP)
2. Add these 4 monitors (interval: 5 minutes):

| Name | URL |
|------|-----|
| ShopFlow Eureka | `https://shopflow-eureka.onrender.com/actuator/health` |
| ShopFlow Gateway | `https://shopflow-gateway.onrender.com/actuator/health` |
| ShopFlow User | `https://shopflow-user.onrender.com/api/users/health` |
| ShopFlow Product | `https://shopflow-product.onrender.com/api/products` |

---

## 10. Known Issues & Fixes

### macOS: `cd service && mvn ... && cd ..` fails
Commands chained with `&&` across directories don't work reliably on macOS.  
**Fix:** Run each `cd` and `mvn` as separate commands.

---

### Apple Silicon (M1/M2/M3): Service crashes on Render
Mac builds `arm64` images. Render needs `linux/amd64`.  
**Fix:** Always use `docker buildx build --platform linux/amd64`

---

### Kafka: Product Service keeps disconnecting
RedpandaCloud requires SASL/SSL auth. Plain connection is rejected → service crashes → unregisters from Eureka → 503 errors.  
**Fix:** Add SASL env vars to both user-service and product-service on Render:
```
SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL = SASL_SSL
SPRING_KAFKA_PROPERTIES_SASL_MECHANISM    = SCRAM-SHA-256
SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG  = org.apache.kafka.common.security.scram.ScramLoginModule required username="shopflow" password="PASSWORD";
```

---

### Netlify: `fatal: No url found for submodule path 'frontend'`
frontend folder had its own `.git` directory — treated as submodule.  
**Fix:**
```bash
git rm --cached frontend
rm -rf frontend/.git
git add frontend/
git commit -m "Fix frontend submodule"
git push
```

---

### Netlify: Publish directory shows `frontend/frontend/build`
Netlify auto-prepends base directory to publish path.  
**Fix:** Set publish directory to just `build` (not `frontend/build`)

---

### Netlify: 404 on page refresh or direct URL
React Router routes don't exist as files on static hosting.  
**Fix:** `frontend/public/_redirects` file with content:
```
/*    /index.html   200
```

---

### Render: 503 from API Gateway
Gateway can't route — services not registered in Eureka yet.  
**Fix:** Open Eureka dashboard → verify USER-SERVICE and PRODUCT-SERVICE show UP. If missing, restart those services on Render and wait 2 minutes.

---

### Render: Services slow or stop responding
Free tier spins down after 15 min inactivity.  
**Fix:** Set up UptimeRobot with 5-minute pings (Step 6 above).

---

### H2 Database resets after restart
H2 is in-memory — data lost on restart. Expected behaviour on free tier.  
**Fix (optional):** Switch to ElephantSQL or Render PostgreSQL for persistence.

---

## 11. Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@shopflow.com` | `admin123` |
| User | Register via `/register` | your choice |

---

## Live URLs

| Resource | URL |
|----------|-----|
| Frontend | `https://YOUR-SITE.netlify.app` |
| API Gateway | `https://shopflow-gateway.onrender.com` |
| Eureka Dashboard | `https://shopflow-eureka.onrender.com` |
| Products API | `https://shopflow-gateway.onrender.com/api/products` |
| Gateway Health | `https://shopflow-gateway.onrender.com/actuator/health` |

---

## Deployment Checklist

- [ ] Java 17 + Maven + Docker Desktop installed and running
- [ ] All 4 services built with `mvn clean package -DskipTests`
- [ ] All 5 Docker images pushed to Docker Hub (using `buildx --platform linux/amd64`)
- [ ] All 5 Docker Hub repos set to Public
- [ ] RedpandaCloud: cluster + SASL user + ACLs + `user-events` topic created
- [ ] Render: Eureka deployed and Live
- [ ] Render: User Service deployed with all env vars including SASL
- [ ] Render: Product Service deployed with all env vars including SASL
- [ ] Render: API Gateway deployed and Live
- [ ] Eureka dashboard shows all 3 services UP
- [ ] `frontend/public/_redirects` file exists with `/* /index.html 200`
- [ ] `frontend/.env` has correct Gateway URL
- [ ] Submodule issue fixed before GitHub push
- [ ] GitHub repo created and pushed
- [ ] Netlify: Base dir = `frontend`, Publish dir = `build`
- [ ] Netlify: `REACT_APP_API_URL` env var set
- [ ] Netlify deploy successful — site live
- [ ] UptimeRobot: 4 monitors added with 5-min interval
- [ ] Login tested with `admin@shopflow.com` / `admin123`
