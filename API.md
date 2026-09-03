# API Endpoint Reference

All REST API endpoints are prefixed with `/api/v1`.

## Authentication & Profile
- `POST /api/v1/auth/register` — Register University or Independent Student.
- `POST /api/v1/auth/login` — Authenticate and receive JWT token.
- `POST /api/v1/auth/logout` — Logout user.
- `GET /api/v1/auth/me` — Get authenticated user details.

## Health Check & Monitoring
- `GET /health` — Check process status (200 OK).
- `GET /ready` — Verify MongoDB database connectivity (200 OK or 503 Service Unavailable).

## Applications & State Machine
- `POST /api/v1/applications` — Submit a clinical attachment application.
- `GET /api/v1/applications` — List applications (filtered by tenant role).
- `GET /api/v1/applications/:id` — Get application details & status history.
- `PATCH /api/v1/applications/:id/status` — Update application lifecycle status.

## Placements & Capacity
- `POST /api/v1/placements` — Create placement (validates capacity & supervisor match).
- `GET /api/v1/placements` — List placements (filtered by tenant role).

## Attendance
- `POST /api/v1/attendance` — Record attendance (validates date uniqueness).
- `GET /api/v1/attendance/attachment/:attachmentId` — List attendance logs.

## Digital Logbook
- `POST /api/v1/logbooks` — Create logbook entry.
- `GET /api/v1/logbooks/attachment/:attachmentId` — List logbook entries.
- `PATCH /api/v1/logbooks/:id/review` — Supervisor review (APPROVE / REVISION_REQUESTED).

## Competency Evaluations
- `POST /api/v1/evaluations` — Submit MID_TERM or FINAL evaluation (triggers completion on passing FINAL).
- `GET /api/v1/evaluations/attachment/:attachmentId` — List evaluations.

## Certificates & Public Verification
- `POST /api/v1/certificates` — Issue certificate upon completion.
- `GET /api/v1/certificates/verify/:code` — **PUBLIC** certificate verification endpoint (privacy-preserving).

## Universities & Organizations
- `GET /api/v1/universities` — List active universities.
- `GET /api/v1/organizations` — List active healthcare organizations.
- `GET /api/v1/organizations/:organizationId/departments` — List departments.
- `GET /api/v1/organizations/:organizationId/supervisors` — List supervisors.
