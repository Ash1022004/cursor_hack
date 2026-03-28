const config = {
    // Convex HTTP routes are proxied selectively via next.config rewrites; other /api/* stay on Next.js
    API_BASE_URL: '',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,


    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',

    },

    API_VERSION: 'v1',
    RETRY_DELAY: 1000,


}


export default config;