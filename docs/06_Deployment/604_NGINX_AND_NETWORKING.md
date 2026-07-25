# 604 — Nginx & Networking

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Edge Networking Architecture

---

# 1. Purpose

This document defines the networking and reverse proxy architecture for ForgeCRM.

The objective is to provide secure, efficient, and reliable routing between external clients and internal services.

---

# 2. Edge Architecture

ForgeCRM uses Nginx as the primary edge reverse proxy.

Responsibilities include:

- TLS termination
- Request routing
- Static asset serving
- Response compression
- Security headers
- Basic edge rate limiting

Business logic remains inside the application.

---

# 3. High-Level Flow

```
Internet

↓

Firewall

↓

Nginx

↓

Frontend

↓

Backend API

↓

Database / Redis / Object Storage
```

Only Nginx is directly exposed to the public internet.

---

# 4. HTTPS

Production traffic uses HTTPS exclusively.

Requirements:

- Modern TLS versions
- Strong cipher suites
- Automatic certificate renewal
- HTTP Strict Transport Security (HSTS)

Plain HTTP should redirect permanently to HTTPS.

---

# 5. TLS Certificates

Certificates should:

- Be issued by a trusted Certificate Authority
- Renew automatically
- Be monitored for expiration

Expired certificates should trigger operational alerts.

---

# 6. Request Routing

Nginx routes requests based on path.

Examples:

```
/

↓

Frontend

/api

↓

Backend API

/ws

↓

WebSocket Service
```

Routing should remain predictable and centralized.

---

# 7. Static Assets

Static assets may be served directly by Nginx.

Examples:

- JavaScript bundles
- CSS
- Fonts
- Images

Cache headers should be configured appropriately.

---

# 8. API Proxying

API requests should:

- Preserve client IP information
- Forward correlation IDs where applicable
- Enforce request size limits
- Respect timeout policies

Backend services remain private.

---

# 9. WebSockets

Nginx must support:

- Protocol upgrades
- Persistent connections
- Appropriate timeout configuration

Authentication remains the responsibility of the backend.

---

# 10. Compression

Enable compression for text-based responses.

Examples:

- HTML
- CSS
- JavaScript
- JSON

Do not compress already compressed assets.

---

# 11. Caching

Cache static assets aggressively.

Avoid caching:

- Authenticated API responses
- Personalized content
- Sensitive information

Cache behavior should be explicit.

---

# 12. Security Headers

Nginx should apply security headers consistently.

Examples:

- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

Where applicable, coordinate with application-level Content Security Policy (CSP).

---

# 13. Request Limits

Configure limits for:

- Maximum request size
- Header size
- Request body size
- Connection timeout

Reject oversized requests early.

---

# 14. Firewall Boundaries

Only required ports should be exposed.

Typical production exposure:

- 80 (redirect only)
- 443 (HTTPS)

Backend infrastructure remains inaccessible from public networks.

---

# 15. Internal Networking

Internal services communicate over isolated private networks.

Examples:

- Backend ↔ PostgreSQL
- Backend ↔ Redis
- Backend ↔ MinIO
- Worker ↔ Backend

Internal traffic should never require public routing.

---

# 16. Logging

Log:

- Request method
- Status code
- Response time
- Client IP
- Correlation ID (if available)

Avoid logging sensitive request contents.

---

# 17. Monitoring

Monitor:

- Request rate
- Error rate
- TLS status
- Certificate expiration
- Upstream failures
- Connection count

Network health is part of overall platform observability.

---

# 18. Future Enhancements

Future capabilities may include:

- Load balancing
- Multi-instance backend routing
- CDN integration
- HTTP/3
- Web Application Firewall (WAF)
- Geographic routing

The architecture should support these additions without redesign.

---

# 19. Summary

ForgeCRM uses Nginx as a secure edge reverse proxy responsible for TLS termination, routing, static asset delivery, compression, and network protection.

By isolating internal services, enforcing HTTPS, applying consistent security headers, and maintaining clear network boundaries, the platform provides a secure and scalable entry point for all client traffic.