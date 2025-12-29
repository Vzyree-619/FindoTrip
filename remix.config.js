/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
    v3_singleFetch: true,
    v3_lazyRouteDiscovery: true,
  },
  browserNodeBuiltinsPolyfill: {
    modules: {
      url: true,
      crypto: true,
      querystring: true,
      path: true,
      stream: true,
      https: true,
      http: true,
      fs: true,
    },
  },
};