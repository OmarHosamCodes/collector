import { existsSync } from "node:fs";
import path from "node:path";

const port = Number.parseInt(process.env.PORT || "3001", 10);
const host = "0.0.0.0";
const clientRoot = path.resolve(import.meta.dir, "dist/client");
const appServerPath = path.resolve(import.meta.dir, "dist/server/server.js");

const appModule = await import(appServerPath);
const appHandler = appModule.default as { fetch: (request: Request) => Promise<Response> };

function resolveStaticPath(urlPathname: string): string | null {
  const pathname = urlPathname === "/" ? "/index.html" : urlPathname;
  const absolutePath = path.resolve(clientRoot, `.${pathname}`);

  if (!absolutePath.startsWith(clientRoot)) {
    return null;
  }

  if (!existsSync(absolutePath)) {
    return null;
  }

  return absolutePath;
}

Bun.serve({
  hostname: host,
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" || request.method === "HEAD") {
      const staticPath = resolveStaticPath(url.pathname);
      if (staticPath) {
        return new Response(Bun.file(staticPath));
      }
    }

    return appHandler.fetch(request);
  },
});

console.log(`collector web server listening on http://${host}:${port}`);
