import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/** All portal routes are dynamic; no R2 cache or second origin server is required. */
export default defineCloudflareConfig();
