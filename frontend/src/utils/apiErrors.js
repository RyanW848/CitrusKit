/**
 * Human-readable message from an axios/fetch error (network, 401, API JSON, etc.).
 */
export function getApiErrorMessage(err, fallback = "Something went wrong.") {
  if (err?.response?.data != null) {
    const d = err.response.data;
    if (typeof d === "string" && d.trim()) {
      if (/^<!DOCTYPE/i.test(d) || /<pre>Cannot POST/i.test(d)) {
        return "Got an HTML error page instead of JSON — the request likely missed the API (proxy or backend not running on the expected port). Restart citruskit-backend and npm start.";
      }
      return d.length > 300 ? `${d.slice(0, 300)}…` : d;
    }
    if (typeof d === "object") {
      if (d.error) return String(d.error);
      if (d.message) return String(d.message);
    }
  }

  if (
    err?.code === "ERR_NETWORK" ||
    err?.message === "Network Error" ||
    !err?.response
  ) {
    return "Cannot reach the API. Start citruskit-backend, ensure its PORT matches frontend/src/setupProxy.js (default 4000, or REACT_APP_PROXY_TARGET), then restart npm start.";
  }

  return fallback;
}
