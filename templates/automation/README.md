# gb-template-automation

Foundational builders **automation** boilerplate (`/fdn:build` project type `automation`). Worker-centric: a
Neon-backed task runner (`POST /api/run`, `GET /api/runs`) with a minimal StyleX status UI. Tenant
workers are HTTP-triggered — wire an external scheduler to `POST /api/run` for recurring jobs (tenant
cron triggers aren't exposed). Same StyleX/Vite build as `../app`.
