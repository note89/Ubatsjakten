import { serve } from "bun";
import path from "path";
import { readFileSync, existsSync } from "fs";

const port = parseInt(process.env.PORT || "3000", 10);

const getMimeType = (filePath: string): string => {
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".js")) return "application/javascript";
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg")) return "image/jpeg";
  if (filePath.endsWith(".aiff")) return "audio/aiff";
  if (filePath.endsWith(".wav")) return "audio/wav";
  if (filePath.endsWith(".mp3")) return "audio/mpeg";
  return "application/octet-stream";
};

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
        if (existsSync(filePath)) {
          return new Response(readFileSync(filePath), {
            headers: { "Content-Type": "application/javascript" },
          });
        }
      }

      if (pathname.startsWith("/assets/")) {
        const filePath = path.join(import.meta.dir, "..", "public", pathname);
        if (existsSync(filePath)) {
          return new Response(readFileSync(filePath), {
            headers: { "Content-Type": getMimeType(filePath) },
          });
        }
      }

      return new Response("Not found", { status: 404 });
    } catch (err) {
      return new Response(`Error: ${err}`, { status: 500 });
    }
  },
});

console.log(`Game running at http://localhost:${port}`);
