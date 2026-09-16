# Coolify Deployment

The repository is split into two independently deployable applications: backend and frontend.

## Production deployment model

Production releases are CI-gated:

1. Changes are reviewed through a pull request into `main`.
2. GitHub Actions runs frontend type checking, the full automated test suite, the application build, and Docker image build validation for both services.
3. Only after all checks succeed on a push to `main` does GitHub Actions call Coolify's authenticated Deploy Webhook.
4. Coolify then rebuilds/redeploys the configured production resource(s).

This means routine production deployment does **not** require clicking Deploy/Redeploy in Coolify.

### One-time Coolify/GitHub bootstrap

Use one of the following deployment-target configurations.

**Preferred for the current two-resource setup**

Create a deploy-only Coolify API token and add these GitHub Actions repository secrets:

- `COOLIFY_TOKEN` — Coolify API token with deployment permission only.
- `COOLIFY_BACKEND_DEPLOY_WEBHOOK` — authenticated Deploy Webhook URL for the backend resource.
- `COOLIFY_FRONTEND_DEPLOY_WEBHOOK` — authenticated Deploy Webhook URL for the frontend resource.

**Alternative: one stack/tag webhook**

If both applications are assigned to one Coolify tag/service deployment target, configure:

- `COOLIFY_TOKEN`
- `COOLIFY_DEPLOY_WEBHOOK`

`COOLIFY_DEPLOY_WEBHOOK` takes precedence over the two per-application webhooks.

The deploy workflow is `.github/workflows/main.yml`. Secrets must never be committed to this repository.

### Avoid duplicate or pre-CI deployments

When GitHub Actions is the production deployment controller, disable Coolify's direct Git **Auto Deploy** for the two production resources. Otherwise a push to `main` can start a Coolify deployment before CI has finished, and the later CI webhook can trigger a second deployment.

After the one-time bootstrap, the normal release path is:

`PR -> CI checks -> merge/push to main -> CI checks -> Coolify webhook -> automatic production deployment`

## Backend application

- Repository: `Azav-v10`
- Base directory: `/backend`
- Build pack: `Dockerfile`
- Internal port: `5000`
- Health check: `/api/ready`

Required environment variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<production-mongodb-uri>
JWT_SECRET=<long-random-production-secret-at-least-32-characters>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://<frontend-domain>
CLIENT_URL=https://<frontend-domain>
```

Mark `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, and `CLIENT_URL` as runtime variables in Coolify. Do not make `MONGODB_URI` or `JWT_SECRET` available to the frontend or commit them to GitHub.

## Frontend application

- Repository: `Azav-v10`
- Base directory: `/frontend`
- Build pack: `Dockerfile`
- Internal port: `80`
- Build argument: `VITE_API_URL=https://<backend-domain>`

The frontend Dockerfile embeds `VITE_API_URL` during the Vite build. The application then calls the backend at `${VITE_API_URL}/api/v1`.

## Container Security & Isolation

Neither the backend (Node.js/Express) nor frontend (Nginx) require elevated Linux capabilities or host hardware device mounts.

- Do **not** use `--cap-add SYS_ADMIN`.
- Do **not** mount host devices (`--device=/dev/...`).
- Leave custom capability additions and device mounts empty in Coolify.
- Keep MongoDB private to the application/server network; do not publish port `27017` to the public internet.

## Production verification checklist

1. Backend resource uses `/backend`, port `5000`, and health check `/api/ready`.
2. Frontend resource uses `/frontend`, port `80`, and a production `VITE_API_URL` pointing to the backend HTTPS domain.
3. MongoDB has persistent storage and an automated backup policy.
4. Both frontend and backend use HTTPS domains managed by the reverse proxy.
5. Backend `CORS_ORIGIN` and `CLIENT_URL` exactly match the frontend HTTPS origin.
6. Coolify direct Git Auto Deploy is disabled when the CI deploy webhook is enabled.
7. `COOLIFY_TOKEN` plus the correct deploy webhook secret(s) exist in GitHub Actions secrets.
8. A merge to `main` produces a successful `AZAAM CI/CD` run and a corresponding Coolify deployment.
9. Backend `/api/ready` is healthy after deployment and the frontend can authenticate against the backend.
10. No `.env`, JWT secret, database credential, Coolify token, or deploy webhook is committed to GitHub.
