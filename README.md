# Chat Frontend

React (Vite) app. Use this as its own repo.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Runs on http://localhost:5173. In dev, `/api` is proxied to http://localhost:5000 — start the backend in the other repo.

## Backend URL (production)

Set `VITE_API_URL` to your backend base URL (e.g. `https://api.yourapp.com`) before building. For local dev you can leave it unset and use the proxy.

## Repo

Push this folder to its own Git repo (e.g. `chat-frontend` on GitHub).
