import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

// The one place the production origin is defined. Everything else reads
// `Astro.site`, so previews and the eventual deployment only need SITE_URL.
const DEFAULT_SITE_URL = 'https://getpokerpath.com';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

export default defineConfig({
  site: env.SITE_URL || DEFAULT_SITE_URL,
  trailingSlash: 'always',
  integrations: [react()],
});
