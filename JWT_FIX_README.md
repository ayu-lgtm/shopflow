# ShopFlow v2 — JWT Auth Fix Guide

## 🐛 Bugs Found & Fixed

### Bug 1 — Gateway: No RBAC (Most Critical)
**File:** `api-gateway/src/main/java/com/shopflow/gateway/config/SecurityConfig.java`

**Problem:** All product and user endpoints were `permitAll()` — JWT was being validated but roles were completely ignored. ANY user with a valid token (or even no token) could call admin endpoints.

**Fix:**
```java
// BEFORE — everything open
.pathMatchers("/api/products/**").permitAll()
.pathMatchers("/api/users/all").permitAll()

// AFTER — proper RBAC
.pathMatchers(HttpMethod.GET, "/api/products", "/api/products/{id}", ...).permitAll()
.pathMatchers("/api/users/all").hasAuthority("ROLE_ADMIN")
.pathMatchers(HttpMethod.POST, "/api/products").hasAuthority("ROLE_ADMIN")
.pathMatchers(HttpMethod.DELETE, "/api/products/**").hasAuthority("ROLE_ADMIN")
.pathMatchers(HttpMethod.PUT, "/api/products/**").hasAuthority("ROLE_ADMIN")
```

---

### Bug 2 — Gateway: JWT Claims Not Extracted as Spring Authorities
**File:** `api-gateway/src/main/java/com/shopflow/gateway/config/SecurityConfig.java`

**Problem:** Gateway was not converting JWT `role` claim into Spring Security `GrantedAuthority`. So even with correct auth rules, `hasAuthority("ROLE_ADMIN")` always failed because no authority was ever populated.

**Fix:** Added `jwtAuthenticationConverter()`:
```java
converter.setJwtGrantedAuthoritiesConverter(jwt -> {
    String role = jwt.getClaimAsString("role");
    String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
    return List.of(new SimpleGrantedAuthority(authority));
});
```

---

### Bug 3 — Gateway: No Downstream Header Injection
**Problem:** Product Service uses `X-User-Email` to validate creator via Feign and for audit trail. But the Gateway never injected this header from the JWT claims — it relied on the frontend to send it manually, which is insecure.

**Fix:** Added `jwtHeaderInjectionFilter()` WebFilter that automatically injects `X-User-Email` and `X-User-Role` from verified JWT claims into every downstream request.

---

### Bug 4 — User Service: No Default Admin User
**File:** `user-service/src/main/java/com/shopflow/user/service/UserService.java`

**Problem:** No admin user was ever created, so the ADMIN role was untestable.

**Fix:** Added `@PostConstruct seedAdminUser()`:
```
Email:    admin@shopflow.com
Password: admin123
Role:     ADMIN
```

---

### Bug 5 — User Service: Missing Profile Endpoint
**Problem:** No way for authenticated users to fetch their own profile. Gateway injects `X-User-Email` but no endpoint consumed it.

**Fix:** Added `GET /api/users/profile` that uses the gateway-injected header.

---

### Bug 6 — Frontend: No RBAC in UI
**File:** `frontend/src/store/index.js`, `App.js`, `components/Navbar.js`, `pages/DashboardPage.js`

**Problems:**
- Any logged-in user could see "Add Product" and "Delete" buttons (UI showed them, API would block — confusing UX)
- No Admin Panel page existed
- No 401/403 auto-logout on token expiry
- No role badge visible to user

**Fixes:**
- `selectIsAdmin` selector added to store
- `AdminRoute` component in App.js blocks non-admins at route level
- Navbar shows `ADMIN` badge and Admin Panel link only for admins
- Dashboard hides create/delete buttons for regular users
- Axios 401/403 interceptor auto-clears token and redirects to login
- New `AdminPage` shows user list (calls `/api/users/all` with token)

---

## 🔐 Auth Flow (After Fix)

```
User/Admin Login
      │
      ▼
User Service generates JWT:
  { sub: "email@x.com", role: "ADMIN", exp: ... }
      │
      ▼
Frontend stores token in localStorage
axios interceptor adds: Authorization: Bearer <token>
      │
      ▼
API Gateway receives request
  1. Validates JWT signature (HS384, shared secret)
  2. Extracts role → maps to ROLE_ADMIN / ROLE_USER
  3. Checks .hasAuthority() rules:
     - ADMIN endpoints → 403 if not ROLE_ADMIN
     - Public endpoints → pass through
  4. Injects X-User-Email + X-User-Role into downstream request
      │
      ▼
Product / User Service
  - No re-validation of JWT needed
  - Uses X-User-Email for Feign validation + audit trail
```

---

## 🧪 Test Credentials

| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| ADMIN | admin@shopflow.com     | admin123  |
| USER  | Register via /register | your choice |

---

## 📦 Postman Collection

Import `ShopFlow_JWT_Postman_Collection.json`

**Collection Variables:**
- `baseUrl` → `http://localhost:8080`
- `adminToken` → auto-filled by "Admin Login" request
- `userToken` → auto-filled by "User Login" request

**Test folders:**
1. Auth — Public (register, login, error cases)
2. Users — Protected (profile, all-users, role checks)
3. Products — Public GET
4. Products — Admin CRUD (with 401/403 negative tests)
5. Token Edge Cases (invalid/malformed JWT)
6. Health Checks

---

## 🚀 Run Locally

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Services start on:
#    Eureka:          http://localhost:8761
#    API Gateway:     http://localhost:8080
#    User Service:    http://localhost:8081
#    Product Service: http://localhost:8082
#    Frontend:        http://localhost:3000
```
