const http = require("http");
const path = require("path");
const fs = require("fs");
const { parseWorklabCSV } = require("./worklab-csv");
const { generateB2CMessage } = require("./b2c");
const { generateB2BMessage, parseLeadsInput } = require("./b2b");

const PORT = process.env.PORT || 8787;
// server/webapp is a copy of the repo-root webapp/, kept in sync manually —
// needed so this resolves correctly even when only `server/` is the deploy
// build context (e.g. Railway with rootDirectory=server).
const WEBAPP_DIR = path.join(__dirname, "..", "webapp");

function sendJSON(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

/** 8 MB is far more than a Worklab export needs, and bounds memory per request. */
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 8 * 1024 * 1024);

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    let bytes = 0;
    let overflowed = false;
    req.on("data", (chunk) => {
      if (overflowed) return; // keep draining, stop accumulating
      bytes += chunk.length;
      // Without a cap, one oversized upload takes the process down with it —
      // which from the outside looks exactly like the server going quiet.
      if (bytes > MAX_BODY_BYTES) {
        overflowed = true;
        data = "";
        // Rejected, not destroyed: tearing the socket down here would reach the
        // browser as a connection error instead of a readable 413.
        reject(Object.assign(new Error("Ficheiro demasiado grande (máx. 8 MB)."), { status: 413 }));
        return;
      }
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/** The path alone, without the query string, decoded. */
function pathOf(url) {
  const raw = (url || "/").split("?")[0].split("#")[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function contentTypeFor(filePath) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

const server = http.createServer(async (req, res) => {
  try {
    const route = pathOf(req.url);

    // Health first, and on both spellings. This answered 404 before, so every
    // uptime check and every person who typed /health concluded the server was
    // down while it was serving requests perfectly well.
    if (req.method === "GET" && (route === "/health" || route === "/healthz")) {
      return sendJSON(res, 200, {
        status: "ok",
        service: "duoai-server",
        uptimeSeconds: Math.round(process.uptime()),
        time: new Date().toISOString(),
      });
    }

    if (req.method === "POST" && route === "/api/b2c/generate") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const leads = parseWorklabCSV(body.csv || "");
      // Nada do CSV é gravado: os rascunhos voltam na resposta e o operador
      // dispara do próprio WhatsApp pelos links wa.me (LGPD + termos do WhatsApp).
      const options = {
        kind: body.kind,
        labLink: body.labLink,
        specialistLink: body.specialistLink,
        resultLink: body.resultLink,
        rescheduleLink: body.rescheduleLink,
      };
      const messages = await Promise.all(leads.map((lead) => generateB2CMessage(lead, options)));
      const sendable = messages.filter((m) => m.whatsappUrl).length;
      return sendJSON(res, 200, {
        count: messages.length,
        kind: messages[0] ? messages[0].kind : "reativacao",
        sendable,
        blocked: messages.length - sendable,
        messages,
      });
    }

    if (req.method === "POST" && route === "/api/b2b/generate") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const leads = parseLeadsInput(body.leads || "");
      const waLink = body.waLink || "https://wa.me/5500000000000";
      const messages = await Promise.all(leads.map((lead) => generateB2BMessage(lead, waLink)));
      return sendJSON(res, 200, { count: messages.length, messages });
    }

    // Serve o webapp estático (mesmo conteúdo publicado como artifact).
    // `route` já vem sem query string: `/?utm_source=x` servia 404 antes, o que
    // fazia a app parecer morta a quem abria um link com parâmetros.
    if (req.method === "GET" || req.method === "HEAD") {
      const filePath = route === "/" ? "index.html" : route.replace(/^\/+/, "");
      const fullPath = path.join(WEBAPP_DIR, filePath);
      // path.join already collapses "..", so this rejects anything that climbed
      // out of the webapp directory.
      if (
        (fullPath === WEBAPP_DIR || fullPath.startsWith(WEBAPP_DIR + path.sep)) &&
        fs.existsSync(fullPath) &&
        fs.statSync(fullPath).isFile()
      ) {
        const body = fs.readFileSync(fullPath);
        res.writeHead(200, {
          // Served as text/html regardless of extension before, which meant a
          // stylesheet or an icon was rejected by the browser.
          "Content-Type": contentTypeFor(fullPath),
          "Content-Length": body.length,
        });
        return res.end(req.method === "HEAD" ? undefined : body);
      }
    }

    sendJSON(res, 404, { error: "not found", path: route });
  } catch (err) {
    if (!res.headersSent) {
      sendJSON(res, err && err.status ? err.status : 500, { error: err.message });
    }
    // Let the rest of a rejected upload drain instead of sitting in the socket
    // buffer holding the connection open.
    if (!req.readableEnded) req.resume();
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`DuoAI server rodando em http://localhost:${PORT}`);
  });
}

module.exports = { server };
