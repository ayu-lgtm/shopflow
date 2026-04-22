# 🛍 ShopFlow — Microservice Project

**Technologies:** Spring Boot 3 · Eureka · API Gateway · Kafka · JPA/Hibernate · Feign · React · Redux · Docker · Kubernetes

---

## 📁 Project Structure

```
shopflow/
├── eureka-server/       ← Service Discovery (port 8761)
├── api-gateway/         ← Entry point + JWT (port 8080)
├── user-service/        ← Register/Login + Kafka producer (port 8081)
├── product-service/     ← Products + Feign + Kafka consumer (port 8082)
├── frontend/            ← React + Redux + Routing (port 3000)
├── docker-compose.yml   ← Local mein sab ek saath
├── k8s/                 ← Kubernetes YAML files
└── push-to-dockerhub.sh ← Docker Hub push script
```

---

## ⚡ Communication Flow

```
React Frontend
    ↓ HTTP
API Gateway (port 8080)    ←── JWT verify
    ↓ load balanced (Eureka)
┌───────────────────────────────────┐
│  User Service    Product Service  │
│  (port 8081)     (port 8082)      │
│       │               │           │
│       └── Feign ──→  validate()   │  ← SYNC call
│       │                           │
│       └── Kafka publish ──→       │  ← ASYNC event
│              (user-events topic)  │
└───────────────────────────────────┘
```

---

## 🚀 LOCAL SETUP — 3 Tarike

### Tarika 1: Docker Compose (Sabse Asaan ✅)

```bash
# 1. Prerequisites check karo
docker --version       # Docker Desktop install hona chahiye
java --version         # Java 17+
mvn --version          # Maven 3.8+

# 2. Sab services build karo
cd eureka-server && mvn clean package -DskipTests && cd ..
cd api-gateway   && mvn clean package -DskipTests && cd ..
cd user-service  && mvn clean package -DskipTests && cd ..
cd product-service && mvn clean package -DskipTests && cd ..

# 3. Docker Compose se sab start karo
docker-compose up --build

# 4. Browser mein kholo:
# Frontend:  http://localhost:3000
# Eureka:    http://localhost:8761
# Gateway:   http://localhost:8080
# H2 Console (user): http://localhost:8081/h2-console
# H2 Console (product): http://localhost:8082/h2-console
```

---

### Tarika 2: Separately Chalao (Sikhne ke liye best)

**Step 1 — Kafka local pe chalao:**
```bash
# Kafka nahi hai? Docker se chala lo sirf kafka:
docker-compose up zookeeper kafka -d
```

**Step 2 — Services ek ek karke chalao:**
```bash
# Terminal 1 - Eureka
cd eureka-server
mvn spring-boot:run
# http://localhost:8761 pe dekho

# Terminal 2 - User Service
cd user-service
mvn spring-boot:run
# http://localhost:8081/api/users/health

# Terminal 3 - Product Service
cd product-service
mvn spring-boot:run
# http://localhost:8082/api/products

# Terminal 4 - API Gateway
cd api-gateway
mvn spring-boot:run
# http://localhost:8080

# Terminal 5 - Frontend
cd frontend
npm install
npm start
# http://localhost:3000
```

---

### Tarika 3: Sirf Backend Test karo (Postman/curl)

```bash
# Register karo
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ram Prasad","email":"ram@test.com","password":"123456"}'

# Response mein token milega - copy karo
TOKEN="eyJhbGci..."

# Products dekho (no auth needed)
curl http://localhost:8080/api/products

# Product banao (token chahiye)
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Chai","description":"Garam chai","price":10,"stock":100,"category":"Drinks"}'

# Eureka pe registered services dekho
curl http://localhost:8761/eureka/apps
```

---

## 🐳 Docker Hub pe Push Karo

```bash
# 1. Script ko executable banao
chmod +x push-to-dockerhub.sh

# 2. Apna Docker Hub username do
./push-to-dockerhub.sh YOUR_DOCKERHUB_USERNAME

# 3. k8s/deployment.yml mein replace karo
# "YOUR_DOCKERHUB" → "your-actual-username"
```

---

## ☁️ FREE DEPLOYMENT

### Option A: Railway.app (Backend) + Netlify (Frontend)

**Backend (Railway):**
```
1. railway.app pe account banao (GitHub se login)
2. "New Project" → "Deploy from GitHub repo"
3. Ek ek service ke liye alag project banao:
   - shopflow-eureka  (root: /eureka-server)
   - shopflow-user    (root: /user-service)
   - shopflow-product (root: /product-service)
   - shopflow-gateway (root: /api-gateway)
4. Environment variables set karo:
   EUREKA_URL = https://shopflow-eureka.railway.app/eureka/
   KAFKA_URL  = (Railway pe Kafka plugin add karo)
```

**Frontend (Netlify):**
```
1. netlify.com pe account banao
2. GitHub repo connect karo
3. Build settings:
   Base directory: frontend
   Build command:  npm run build
   Publish dir:    frontend/build
4. Environment variable set karo:
   REACT_APP_API_URL = https://shopflow-gateway.railway.app
```

### Option B: Render.com

```
1. render.com pe account banao
2. "New Web Service" → Docker deploy
3. Har service ke liye:
   - Docker image: YOUR_DOCKERHUB/shopflow-eureka:latest
   - Environment variables add karo
4. Frontend ke liye "Static Site" select karo
```

### Option C: Local Kubernetes (Minikube)

```bash
# Minikube install karo
minikube start

# k8s/deployment.yml mein YOUR_DOCKERHUB replace karo

# Deploy karo
kubectl apply -f k8s/

# Status dekho
kubectl get all -n shopflow

# Gateway ka URL pao
minikube service api-gateway -n shopflow --url
```

---

## 🔍 Kya Kahan Dekhu

| Service | URL | Kya dekhna hai |
|---------|-----|----------------|
| Frontend | http://localhost:3000 | React UI |
| Eureka Dashboard | http://localhost:8761 | Registered services |
| Gateway | http://localhost:8080 | All APIs ka entry |
| User H2 DB | http://localhost:8081/h2-console | Users table |
| Product H2 DB | http://localhost:8082/h2-console | Products table |

**H2 Console Settings:**
```
JDBC URL:  jdbc:h2:mem:userdb    (ya productdb)
Username:  sa
Password:  (blank)
```

---

## 🧪 Flow Test Karo

1. **Register karo** → User Service mein save hoga + Kafka pe event jayega
2. **Kafka logs dekho** → Product service terminal mein "ASYNC EVENT RECEIVED" dikhega
3. **Product banao** → Product Service Feign se User Service ko SYNC call karega
4. **Eureka Dashboard** → Dono services registered dikhenge

---

## 🐛 Common Problems

**Kafka error aaye?**
```bash
docker-compose up zookeeper kafka -d
# 30 second wait karo phir services start karo
```

**Services Eureka mein nahi dikh rahe?**
```bash
# Eureka start hone ka wait karo (~30 sec)
# application.yml mein EUREKA_URL check karo
```

**Port already in use?**
```bash
# Mac/Linux
lsof -ti:8080 | xargs kill -9
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**Maven build fail?**
```bash
mvn clean package -DskipTests
# -DskipTests se tests skip honge
```
