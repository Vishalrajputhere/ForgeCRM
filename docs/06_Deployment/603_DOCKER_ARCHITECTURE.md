# 603 — Docker Architecture

**Project:** ForgeCRM

**Version:** 1.0

**Status:** Frozen

**Document Type:** Container Architecture

---

# 1. Purpose

This document defines the Docker architecture used to build, package, and run ForgeCRM.

The objective is to create secure, reproducible, lightweight, and production-ready containers that behave consistently across every deployment environment.

---

# 2. Container Philosophy

ForgeCRM follows these principles:

- One process per container
- Immutable containers
- Stateless application containers
- Small images
- Secure by default
- Fast startup
- Reproducible builds

Containers are deployment artifacts, not virtual machines.

---

# 3. Services

Each major component runs in its own container.

Examples:

- Next.js Frontend
- FastAPI Backend
- Celery Worker
- PostgreSQL
- Redis
- MinIO
- Nginx Reverse Proxy

Containers communicate over an isolated Docker network.

---

# 4. Multi-Stage Builds

Application images use multi-stage builds.

Example:

```
Dependencies

↓

Build

↓

Runtime
```

Only runtime artifacts are included in the final image.

Development tooling is excluded.

---

# 5. Image Versioning

Every image should be versioned.

Examples:

- Semantic version
- Git commit SHA
- Release tag

Avoid using `latest` in production deployments.

---

# 6. Base Images

Use:

- Official images
- Minimal images
- Actively maintained images

Prefer slim variants where practical.

Base images should be updated regularly.

---

# 7. Container User

Application containers should not run as root.

Use dedicated non-privileged users whenever possible.

Least privilege applies inside containers.

---

# 8. Build Context

Keep build contexts minimal.

Exclude:

- Git history
- Documentation
- Local caches
- Test artifacts
- Environment files

Use `.dockerignore` to reduce build size.

---

# 9. Environment Variables

Configuration is injected at runtime.

Containers should not contain:

- Secrets
- Environment-specific configuration

The same image should run in every environment.

---

# 10. Networking

Containers communicate through internal Docker networks.

Public access should be limited to:

- Nginx

Backend services remain inaccessible from the public internet.

---

# 11. Persistent Storage

Persistent data is stored outside application containers.

Examples:

- PostgreSQL data
- MinIO objects
- Uploaded files

Application containers remain disposable.

---

# 12. Startup Order

Services start according to dependencies.

Example:

```
Database

↓

Redis

↓

Object Storage

↓

Backend

↓

Workers

↓

Frontend

↓

Reverse Proxy
```

Dependency readiness should be verified through health checks rather than startup timing alone.

---

# 13. Health Checks

Every service should expose health information.

Examples:

- Liveness
- Readiness

Unhealthy containers should be restarted automatically according to deployment policy.

---

# 14. Resource Limits

Define resource limits for:

- CPU
- Memory
- Storage

Containers should not consume unlimited resources.

---

# 15. Logging

Containers should write logs to:

- stdout
- stderr

Avoid writing application logs to local container files.

Centralized log collection is handled externally.

---

# 16. Image Security

Images should:

- Minimize installed packages
- Remove build tools from runtime images
- Avoid unnecessary shells and utilities
- Be scanned for vulnerabilities before release

Security scanning should be part of CI.

---

# 17. Registry

Container images should be stored in a trusted registry.

Requirements:

- Authentication
- Version retention
- Access control

Only signed and approved images should be promoted to production.

---

# 18. Lifecycle

Container lifecycle:

```
Build

↓

Push

↓

Deploy

↓

Run

↓

Health Monitoring

↓

Replace

↓

Destroy
```

Containers should be replaced rather than modified.

---

# 19. Local Development

Docker Compose provides a consistent local development environment.

Developers should be able to start the platform with a single command.

Local development may mount source code for rapid iteration.

---

# 20. Future Enhancements

Future capabilities may include:

- Distroless runtime images
- Image signing
- SBOM generation
- Kubernetes deployment
- Rootless container runtime
- Automated image policy enforcement

The container architecture should support these enhancements.

---

# 21. Summary

ForgeCRM adopts a container-first architecture built on immutable, minimal, non-root containers with multi-stage builds, isolated networking, centralized logging, and runtime configuration.

By separating services into focused containers and treating images as immutable deployment artifacts, the platform achieves portability, security, operational consistency, and scalability.