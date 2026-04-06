# CitrusKit

## Run locally

1. **MongoDB**  
   Install [MongoDB Community](https://www.mongodb.com/try/download/community) locally, or create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and copy its connection string.

2. **Backend** (`citruskit-backend`)

   ```bash
   cd citruskit-backend
   ```

   Copy `.env.example` to `.env` in that folder (Explorer, or `copy .env.example .env` in Command Prompt / `Copy-Item .env.example .env` in PowerShell). Edit `.env`: set `MONGO_URI` and `JWT_SECRET` (any long random string is fine for dev).

   **`MONGO_URI` must be reachable** when you start the server. If you see `ETIMEDOUT` to a LAN IP (e.g. `192.168.x.x`), use Mongo on your machine (`mongodb://127.0.0.1:27017/citruskit`) or fix the network. The API process still listens on `PORT` even if Mongo is down, but league routes return **503** until Mongo connects.

   ```bash
   npm install
   npm run dev
   ```

   Set `PORT` in `.env` if you like (default **5000**). Health check: `http://localhost:<PORT>/api/health`.

3. **Frontend** (`frontend`)

   ```bash
   cd frontend
   npm install
   npm start
   ```

   Opens **http://localhost:3000**. During **`npm start`**, API requests use **`/api` on the same origin**; **`src/setupProxy.js`** forwards `/api/*` to the backend (default **`http://localhost:4000`**). Match that to `PORT` in `citruskit-backend/.env`, or set **`REACT_APP_PROXY_TARGET`** (e.g. `http://localhost:5000`) in `frontend/.env`.

   For **`npm run build`** / production, set **`REACT_APP_BACKEND`** in `frontend/.env` to the full API root (e.g. `https://your-api.com/api`).

4. **First use**  
   Create an account from the UI, then sign in. Leagues and other protected routes need a valid JWT (stored after login).
