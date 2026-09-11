/**
 * Serve o painel construído e encaminha /api para o servidor da API.
 *
 * Sem dependências de propósito: é um processo que tem de arrancar sempre, e
 * cada pacote a mais é uma forma a mais de não arrancar.
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const PORTA = Number(process.env.PORT ?? 8080);
const API = (process.env.API_PROXY_TARGET ?? "").replace(/\/$/, "");
const RAIZ = join(import.meta.dirname, "dist");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

async function encaminhar(req, res) {
  if (!API) {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "API_PROXY_TARGET não está definido neste serviço" }));
    return;
  }
  const corpo =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await new Promise((ok) => {
          const partes = [];
          req.on("data", (c) => partes.push(c));
          req.on("end", () => ok(Buffer.concat(partes)));
        });

  const cabecalhos = { ...req.headers };
  delete cabecalhos.host;
  delete cabecalhos["content-length"];

  try {
    const r = await fetch(API + req.url, { method: req.method, headers: cabecalhos, body: corpo });
    const saida = Object.fromEntries(r.headers);
    delete saida["content-encoding"];
    delete saida["content-length"];
    delete saida["transfer-encoding"];
    res.writeHead(r.status, saida);
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: `não consegui falar com a API: ${e.message}` }));
  }
}

async function servir(res, caminho, cache) {
  const tipo = TIPOS[extname(caminho)] ?? "application/octet-stream";
  res.writeHead(200, { "content-type": tipo, "cache-control": cache });
  createReadStream(caminho).pipe(res);
}

createServer(async (req, res) => {
  if (req.url === "/saude") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }
  if (req.url.startsWith("/api")) return encaminhar(req, res);

  // normalize impede que ".." saia da pasta dist.
  const pedido = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const alvo = join(RAIZ, pedido);
  try {
    const info = await stat(alvo);
    if (info.isFile()) {
      // Os ficheiros com hash no nome nunca mudam; o index.html tem de mudar sempre.
      return servir(res, alvo, pedido.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache");
    }
  } catch {
    /* cai para o index: as rotas do painel vivem no browser */
  }
  return servir(res, join(RAIZ, "index.html"), "no-cache");
}).listen(PORTA, () => {
  console.log(`painel em :${PORTA} — API em ${API || "(por definir)"}`);
});
