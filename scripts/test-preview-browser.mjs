/**
 * Regression entry point.
 * Use a real stripping HTTP proxy: browser header overrides alone do not reliably
 * block Cookie because the browser may reinsert it from its cookie jar.
 *
 * TEST_ADMIN_PASSWORD is supplied only in the test environment.
 */
await import("./test-admin-session-proxy.mjs");
