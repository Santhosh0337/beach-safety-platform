
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// DEV ONLY: serves api/<name>.ts at /api/<name> during `npm run dev`.
// Vercel is the real runtime. This plugin is not part of production builds.
function localApi(): Plugin {
  return {
    name: 'local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        const pathname = (req.url ?? '/').split('?')[0] ?? '/';
        const sendJson = (code: number, body: unknown) => {
          res.statusCode = code;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(body));
        };

        if (!/^\/[a-z0-9-]+$/.test(pathname)) {
          sendJson(404, { error: 'Not found' });
          return;
        }

        try {
          const mod: unknown = await server.ssrLoadModule(`/api${pathname}.ts`);
          const handler = (mod as { default?: unknown }).default;

          if (typeof handler !== 'function') {
            sendJson(404, { error: 'Not found' });
            return;
          }

          const apiRes = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return apiRes;
            },
            json(body: unknown) {
              sendJson(res.statusCode || 200, body);
            },
          });

          await handler(req, apiRes);
        } catch (error) {
          const missing =
            error instanceof Error &&
            /Failed to load url|Cannot find module/.test(error.message);

          if (!missing) console.error('[local-api]', error);

          sendJson(missing ? 404 : 500, {
            error: missing ? 'Not found' : 'Internal server error',
          });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApi()],
});
