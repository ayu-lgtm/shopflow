import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function HomePage() {
  const { user } = useSelector(s => s.auth);

  return (
    <div className="home-page">
      <div className="hero">
        <h1>🛍 Welcome to ShopFlow</h1>
        <p>Microservice architecture demo — Eureka + Gateway + Kafka + JPA + React + Redux</p>
        <div className="hero-actions">
          <Link to="/products" className="btn-primary">Browse Products</Link>
          {!user && <Link to="/register" className="btn-outline">Get Started</Link>}
          {user && <Link to="/dashboard" className="btn-outline">My Dashboard</Link>}
        </div>
      </div>

      <div className="tech-grid">
        {[
          { icon: '🔍', title: 'Eureka', desc: 'Service Discovery — sab services yahan register hote hain' },
          { icon: '🚪', title: 'API Gateway', desc: 'Single entry point — JWT verify karta hai' },
          { icon: '📨', title: 'Kafka (Async)', desc: 'User register → event publish → product service sunta hai' },
          { icon: '🔗', title: 'Feign (Sync)', desc: 'Product service → User service ko direct call karta hai' },
          { icon: '🗄', title: 'JPA + Hibernate', desc: 'Database se baat karna easy — H2 local, PostgreSQL prod' },
          { icon: '⚛', title: 'React + Redux', desc: 'Global state management + React Router for navigation' },
        ].map(tech => (
          <div key={tech.title} className="tech-card">
            <span className="tech-icon">{tech.icon}</span>
            <h3>{tech.title}</h3>
            <p>{tech.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
