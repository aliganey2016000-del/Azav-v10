# Coolify Deployment

The repository is split into two independently deployable applications.

## Backend application

- Repository: `Azav-v10`
- Base directory: `/backend`
- Build pack: `Dockerfile`
- Port: `3000` (or the port configured in the environment)
- Health check: `/api/ready`

Required environment variables:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=<production-mongodb-uri>
JWT_SECRET=<long-random-production-secret>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://<frontend-domain>
CLIENT_URL=https://<frontend-domain>
```

Mark `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, and `CLIENT_URL` as **Runtime only** in Coolify. Do not make `MONGODB_URI` or `JWT_SECRET` available at build time. The backend Dockerfile explicitly installs build dependencies in its builder stage and installs production dependencies only in the runtime stage.

## Frontend application

- Repository: `Azav-v10`
- Base directory: `/frontend`
- Build pack: `Dockerfile`
- Port: `80`
- Build argument: `VITE_API_URL=https://<backend-domain>`

The frontend Dockerfile embeds `VITE_API_URL` during the Vite build. The application then calls the backend at `${VITE_API_URL}/api/v1`.

## Container Security & Isolation

Neither the backend (Node.js/Express) nor frontend (Nginx) require elevated Linux capabilities or host hardware device mounts.

- **Do NOT use `--cap-add SYS_ADMIN`**: The application does not perform kernel mount operations, sandbox container management, or system trace actions. Granting `SYS_ADMIN` introduces unnecessary security exposure.
- **Do NOT mount host devices (`--device=/dev/...`)**: The application does not interact with host hardware or GPU devices. Standard Docker container isolation must be preserved.
- In Coolify container configuration settings, leave custom capability additions and device mounts empty.

## Contabo checklist

1. Install Coolify on the Contabo VPS.
2. Create the backend resource using base directory `/backend`.
3. Add the backend environment variables and deploy it.
4. Confirm `https://<backend-domain>/api/ready` returns `READY`.
5. Create the frontend resource using base directory `/frontend`.
6. Set the `VITE_API_URL` build argument to the backend domain.
7. Deploy the frontend and set the frontend domain in the backend `CORS_ORIGIN`.
8. Add the frontend domain to MongoDB Atlas only when needed for application access; MongoDB Atlas primarily needs the Contabo server's outbound IP allowlisted.

Never commit `.env`, production database credentials, or JWT secrets to GitHub.
