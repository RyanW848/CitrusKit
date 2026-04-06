const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * Forwards /api/* → CitrusKit backend. Use 127.0.0.1 to avoid Windows IPv6 (::1) mismatches.
 */
module.exports = function setupProxy(app) {
  const target =
    process.env.REACT_APP_PROXY_TARGET || "http://127.0.0.1:4000";

  app.use(
    createProxyMiddleware("/api", {
      target,
      changeOrigin: true,
    })
  );
};
