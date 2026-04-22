import { useState } from "react";

const services = {
  frontend: { id: "frontend", label: "React Frontend", sub: "Netlify • Port 3000", color: "#61DAFB", bg: "#1a2a3a", icon: "⚛️" },
  gateway: { id: "gateway", label: "API Gateway", sub: "Render • Port 8080", color: "#FF6B35", bg: "#2a1a0a", icon: "🔀" },
  eureka: { id: "eureka", label: "Eureka Server", sub: "Render • Port 8761", color: "#A78BFA", bg: "#1e1a2e", icon: "🗂️" },
  user: { id: "user", label: "User Service", sub: "Render • Port 8081", color: "#34D399", bg: "#0a2a1e", icon: "👤" },
  product: { id: "product", label: "Product Service", sub: "Render • Port 8082", color: "#FBBF24", bg: "#2a220a", icon: "📦" },
  kafka: { id: "kafka", label: "Kafka", sub: "RedpandaCloud", color: "#F87171", bg: "#2a0a0a", icon: "📨" },
  db1: { id: "db1", label: "H2 Database", sub: "User DB (in-memory)", color: "#94A3B8", bg: "#1a1f2e", icon: "🗄️" },
  db2: { id: "db2", label: "H2 Database", sub: "Product DB (in-memory)", color: "#94A3B8", bg: "#1a1f2e", icon: "🗄️" },
};

const connections = [
  { from: "frontend", to: "gateway", label: "HTTPS REST", color: "#61DAFB", type: "solid" },
  { from: "gateway", to: "eureka", label: "Service Discovery", color: "#A78BFA", type: "dashed" },
  { from: "gateway", to: "user", label: "Route /api/users", color: "#FF6B35", type: "solid" },
  { from: "gateway", to: "product", label: "Route /api/products", color: "#FF6B35", type: "solid" },
  { from: "user", to: "kafka", label: "Publish Events", color: "#F87171", type: "solid" },
  { from: "kafka", to: "product", label: "Consume Events", color: "#F87171", type: "solid" },
  { from: "product", to: "user", label: "Feign (Sync)", color: "#34D399", type: "dashed" },
  { from: "user", to: "db1", label: "JPA", color: "#94A3B8", type: "solid" },
  { from: "product", to: "db2", label: "JPA", color: "#94A3B8", type: "solid" },
];

const flows = [
  {
    id: "auth",
    title: "🔐 Auth Flow",
    color: "#61DAFB",
    steps: [
      { num: 1, text: "User sends POST /login from React frontend" },
      { num: 2, text: "API Gateway receives → validates JWT (if present)" },
      { num: 3, text: "Routes to User Service via Eureka discovery" },
      { num: 4, text: "User Service generates JWT with {email, role, exp}" },
      { num: 5, text: "Token returned → stored in localStorage" },
      { num: 6, text: "Axios interceptor auto-adds Bearer token to every request" },
    ],
  },
  {
    id: "kafka",
    title: "📨 Kafka Async Flow",
    color: "#F87171",
    steps: [
      { num: 1, text: "User registers → User Service saves to H2 DB" },
      { num: 2, text: "KafkaEventPublisher publishes to 'user-events' topic" },
      { num: 3, text: "RedpandaCloud brokers store the event" },
      { num: 4, text: "Product Service consumer reads event asynchronously" },
      { num: 5, text: "Logs: 'ASYNC EVENT RECEIVED: user registered'" },
    ],
  },
  {
    id: "feign",
    title: "🔗 Feign Sync Flow",
    color: "#34D399",
    steps: [
      { num: 1, text: "Admin creates product via POST /api/products" },
      { num: 2, text: "Gateway injects X-User-Email header from JWT" },
      { num: 3, text: "Product Service calls User Service via Feign client" },
      { num: 4, text: "User Service validates: is this user real + active?" },
      { num: 5, text: "Product Service saves product only if user is valid" },
    ],
  },
  {
    id: "rbac",
    title: "🛡️ RBAC Flow",
    color: "#FF6B35",
    steps: [
      { num: 1, text: "Request hits API Gateway with Bearer token" },
      { num: 2, text: "Gateway extracts 'role' claim from JWT" },
      { num: 3, text: "Maps to ROLE_ADMIN or ROLE_USER authority" },
      { num: 4, text: "Checks path rules: POST /products → ADMIN only" },
      { num: 5, text: "403 Forbidden if role insufficient, else route forward" },
    ],
  },
];

function ServiceCard({ service, active, onClick }) {
  return (
    <div
      onClick={() => onClick(service.id)}
      style={{
        background: active ? service.bg : "#111827",
        border: `2px solid ${active ? service.color : "#374151"}`,
        borderRadius: 12,
        padding: "10px 14px",
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: active ? `0 0 16px ${service.color}55` : "none",
        minWidth: 140,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 22 }}>{service.icon}</div>
      <div style={{ color: service.color, fontWeight: 700, fontSize: 13, marginTop: 4 }}>{service.label}</div>
      <div style={{ color: "#9CA3AF", fontSize: 11, marginTop: 2 }}>{service.sub}</div>
    </div>
  );
}

export default function App() {
  const [activeFlow, setActiveFlow] = useState("auth");
  const [activeService, setActiveService] = useState(null);

  const currentFlow = flows.find((f) => f.id === activeFlow);

  return (
    <div style={{ background: "#0D1117", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#E5E7EB", padding: 24 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, background: "linear-gradient(90deg, #61DAFB, #A78BFA, #F87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
          ShopFlow v2 — Architecture
        </h1>
        <p style={{ color: "#6B7280", marginTop: 8, fontSize: 14 }}>Spring Boot Microservices · React · Kafka · JWT · Docker</p>
      </div>

      {/* Main Architecture Diagram */}
      <div style={{ background: "#161B22", borderRadius: 16, padding: 28, marginBottom: 28, border: "1px solid #30363D" }}>
        <h2 style={{ color: "#E5E7EB", fontSize: 16, fontWeight: 700, marginBottom: 20, marginTop: 0 }}>🏗️ System Architecture</h2>

        {/* Layer 1: Frontend */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#4B5563", fontSize: 11, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Presentation Layer</div>
            <ServiceCard service={services.frontend} active={activeService === "frontend"} onClick={setActiveService} />
          </div>
        </div>

        {/* Arrow */}
        <div style={{ textAlign: "center", color: "#61DAFB", fontSize: 11, marginBottom: 4 }}>↓ HTTPS REST</div>

        {/* Layer 2: Gateway */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#4B5563", fontSize: 11, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Gateway Layer</div>
            <ServiceCard service={services.gateway} active={activeService === "gateway"} onClick={setActiveService} />
            <div style={{ color: "#FF6B35", fontSize: 11, marginTop: 4 }}>JWT Verify · RBAC · Header Injection</div>
          </div>
        </div>

        {/* Eureka line */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ height: 1, width: 60, background: "#A78BFA", borderTop: "1px dashed #A78BFA" }} />
          <ServiceCard service={services.eureka} active={activeService === "eureka"} onClick={setActiveService} />
          <div style={{ height: 1, width: 60, background: "#A78BFA", borderTop: "1px dashed #A78BFA" }} />
        </div>
        <div style={{ textAlign: "center", color: "#A78BFA", fontSize: 11, marginBottom: 8 }}>↕ Service Discovery (Register / Lookup)</div>

        {/* Arrow down */}
        <div style={{ display: "flex", justifyContent: "center", gap: 80, marginBottom: 4 }}>
          <div style={{ color: "#FF6B35", fontSize: 11 }}>↓ /api/users</div>
          <div style={{ color: "#FF6B35", fontSize: 11 }}>↓ /api/products</div>
        </div>

        {/* Layer 3: Services */}
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 8 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#4B5563", fontSize: 11, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Service Layer</div>
            <ServiceCard service={services.user} active={activeService === "user"} onClick={setActiveService} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4 }}>
            <div style={{ color: "#34D399", fontSize: 10, textAlign: "center" }}>← Feign (Sync) →</div>
            <div style={{ width: 80, height: 1, borderTop: "2px dashed #34D399" }} />
            <div style={{ color: "#F87171", fontSize: 10 }}>Kafka Events</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#4B5563", fontSize: 11, marginBottom: 6, opacity: 0 }}>_</div>
            <ServiceCard service={services.product} active={activeService === "product"} onClick={setActiveService} />
          </div>
        </div>

        {/* Kafka */}
        <div style={{ display: "flex", justifyContent: "center", gap: 80, marginBottom: 4 }}>
          <div style={{ color: "#F87171", fontSize: 11 }}>↓ Publish</div>
          <div style={{ color: "#F87171", fontSize: 11 }}>↑ Consume</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <ServiceCard service={services.kafka} active={activeService === "kafka"} onClick={setActiveService} />
        </div>

        {/* Layer 4: Databases */}
        <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#4B5563", fontSize: 11, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Data Layer</div>
            <ServiceCard service={services.db1} active={activeService === "db1"} onClick={setActiveService} />
          </div>
          <div style={{ width: 120 }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#4B5563", fontSize: 11, marginBottom: 6, opacity: 0 }}>_</div>
            <ServiceCard service={services.db2} active={activeService === "db2"} onClick={setActiveService} />
          </div>
        </div>
      </div>

      {/* Flow Diagrams */}
      <div style={{ background: "#161B22", borderRadius: 16, padding: 28, marginBottom: 28, border: "1px solid #30363D" }}>
        <h2 style={{ color: "#E5E7EB", fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>🔄 Communication Flows</h2>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {flows.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFlow(f.id)}
              style={{
                background: activeFlow === f.id ? f.color + "22" : "#1F2937",
                border: `1px solid ${activeFlow === f.id ? f.color : "#374151"}`,
                color: activeFlow === f.id ? f.color : "#9CA3AF",
                borderRadius: 8,
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: activeFlow === f.id ? 700 : 400,
                transition: "all 0.2s",
              }}
            >
              {f.title}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {currentFlow.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                background: currentFlow.color + "22",
                border: `1px solid ${currentFlow.color}`,
                color: currentFlow.color,
                borderRadius: "50%",
                width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {step.num}
              </div>
              {i < currentFlow.steps.length - 1 && (
                <div style={{ position: "absolute", marginLeft: 13, marginTop: 28, width: 2, height: 22, background: currentFlow.color + "33" }} />
              )}
              <div style={{ background: "#1F2937", borderRadius: 8, padding: "8px 14px", flex: 1, fontSize: 13, color: "#D1D5DB", border: "1px solid #374151" }}>
                {step.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack Grid */}
      <div style={{ background: "#161B22", borderRadius: 16, padding: 28, border: "1px solid #30363D" }}>
        <h2 style={{ color: "#E5E7EB", fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>🛠️ Tech Stack</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {[
            { layer: "Backend", tech: "Spring Boot 3", color: "#34D399" },
            { layer: "Discovery", tech: "Netflix Eureka", color: "#A78BFA" },
            { layer: "Gateway", tech: "Spring Cloud Gateway", color: "#FF6B35" },
            { layer: "Sync Comm", tech: "OpenFeign Client", color: "#34D399" },
            { layer: "Async Comm", tech: "Apache Kafka", color: "#F87171" },
            { layer: "Auth", tech: "JWT (HS384)", color: "#FBBF24" },
            { layer: "Database", tech: "H2 In-Memory", color: "#94A3B8" },
            { layer: "Frontend", tech: "React 18 + Redux", color: "#61DAFB" },
            { layer: "Container", tech: "Docker + Buildx", color: "#2496ED" },
            { layer: "Deploy BE", tech: "Render.com", color: "#46E3B7" },
            { layer: "Deploy FE", tech: "Netlify", color: "#00C7B7" },
            { layer: "Kafka Cloud", tech: "RedpandaCloud", color: "#FF6B6B" },
          ].map((item) => (
            <div key={item.tech} style={{ background: "#1F2937", borderRadius: 10, padding: "12px 14px", border: "1px solid #374151" }}>
              <div style={{ color: "#6B7280", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{item.layer}</div>
              <div style={{ color: item.color, fontWeight: 700, fontSize: 13, marginTop: 4 }}>{item.tech}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
