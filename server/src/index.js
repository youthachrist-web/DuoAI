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

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/b2c/generate") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const leads = parseWorklabCSV(body.csv || "");
      const messages = await Promise.all(leads.map(generateB2CMessage));
      return sendJSON(res, 200, { count: messages.length, messages });
    }

    if (req.method === "POST" && req.url === "/api/b2b/generate") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const leads = parseLeadsInput(body.leads || "");
      const waLink = body.waLink || "https://wa.me/5500000000000";
      const messages = await Promise.all(leads.map((lead) => generateB2BMessage(lead, waLink)));
      return sendJSON(res, 200, { count: messages.length, messages });
    }

    // Serve o webapp estático (mesmo conteúdo publicado como artifact).
    if (req.method === "GET") {
      const filePath = req.url === "/" ? "index.html" : req.url.replace(/^\//, "");
      const fullPath = path.join(WEBAPP_DIR, filePath);
      if (fullPath.startsWith(WEBAPP_DIR) && fs.existsSync(fullPath)) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(fs.readFileSync(fullPath));
      }
    }

    sendJSON(res, 404, { error: "not found" });
  } catch (err) {
    sendJSON(res, 500, { error: err.message });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`DuoAI server rodando em http://localhost:${PORT}`);
  });
}

module.exports = { server };
