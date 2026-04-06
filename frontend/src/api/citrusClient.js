import axios from "axios";

/**
 * In development, use same-origin `/api` so the CRA dev server proxies to the backend
 * (see `"proxy"` in package.json). Avoids CORS and browser blocks on :3000 → :4000.
 * In production, use REACT_APP_BACKEND (full URL including `/api`).
 */
function resolveBaseURL() {
  if (process.env.NODE_ENV === "development") {
    return "/api";
  }
  const explicit = (process.env.REACT_APP_BACKEND || "").trim().replace(/\/$/, "");
  return explicit || "http://localhost:5000/api";
}

const citrusClient = axios.create({
  baseURL: resolveBaseURL(),
});

citrusClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default citrusClient;
