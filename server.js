// Express wrapper to expose Vercel-style api/* functions on Render
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const apiRoot = path.join(__dirname, 'api');

function toRouteFromFile(relPath) {
  // Normalize separators and strip extension
  let route = relPath.replace(/\\/g, '/').replace(/\.[tj]s$/, '');
  // Map index files to their directory root
  route = route.replace(/(^|\/)index$/, '');
  // Convert Next/Vercel dynamic segments [id] -> :id
  route = route.replace(/\[([^\]/]+)\]/g, ':$1');
  return '/api' + (route ? '/' + route : '');
}

function loadHandlers(dir, base = '') {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = path.join(base, ent.name);

    if (ent.isDirectory()) {
      loadHandlers(full, rel);
      continue;
    }

    if (!/\.[tj]s$/.test(ent.name)) continue;

    const route = toRouteFromFile(rel);
    // Load handler module (CommonJS or transpiled default export)
    // For pure ESM modules, consider converting this file to ESM and using dynamic import.
    // eslint-disable-next-line import/no-dynamic-require, global-require
    let mod = require(full);
    const handler = mod && (mod.default || mod.handler || mod);

    if (typeof handler !== 'function') {
      console.warn(`Skipping ${rel}: no exported handler function`);
      continue;
    }

    app.all(route, async (req, res, next) => {
      try {
        const result = await handler(req, res);
        // If handler returned data and didn't send a response, send it
        if (!res.headersSent && result !== undefined) {
          res.send(result);
        }
      } catch (err) {
        next(err);
      }
    });

    console.log(`Mapped ${rel} -> ${route}`);
  }
}

if (fs.existsSync(apiRoot)) {
  loadHandlers(apiRoot);
} else {
  console.warn('No api directory found; nothing to serve under /api');
}

app.get('/healthz', (_req, res) => res.send('OK'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
