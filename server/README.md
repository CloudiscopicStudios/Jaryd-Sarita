# Token server for Wedding Drive

This small server exchanges Google OAuth auth codes for tokens and stores a refresh token securely on the server. It also exposes an endpoint to refresh the access token using the stored refresh token.

Setup

1. Copy `.env.example` to `.env` and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
2. Install dependencies and start the server:

```bash
cd server
npm install
npm start
```

Environment variables

- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret (keep secret)
- `FRONTEND_ORIGIN` - origin of your Vite app (e.g. `http://localhost:5173`)
- `PORT` - server port (default 4000)

Endpoints

- `POST /auth/exchange` - body: `{ code, redirect_uri }`. Exchanges code, stores refresh token server-side, returns `{ access_token, expires_in }`.
- `GET /auth/token` - returns a fresh access token using stored refresh token.
- `POST /auth/logout` - clears stored refresh token.
