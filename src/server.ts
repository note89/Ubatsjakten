import { serve } from "bun";
import path from "path";
import { readFileSync } from "fs";

const port = 3000;

const server = serve({
  port,
  async fetch(req: Request) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    try {
      if (pathname === "/" || pathname === "/index.html") {
        const indexPath = path.join(import.meta.dir, "../index.html");
        return new Response(readFileSync(indexPath), {
          headers: { "Content-Type": "text/html" },
        });
      }

      if (pathname.startsWith("/dist/")) {
        const filePath = path.join(import.meta.dir, "..", pathname);
        return new Response(readFileSync(filePath), {
          headers: { "Content-Type": "application/javascript" },
        });
      }

      return new Response("Not found", { status: 404 });
    } catch (err) {
      return new Response(`Error: ${err}`, { status: 500 });
    }
  },
});

console.log(`Game running at http://localhost:${port}`);
