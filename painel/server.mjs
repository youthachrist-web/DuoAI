/**
 * Serve o painel construído e encaminha /api para o servidor da API.
 *
 * Sem dependências de propósito: é um processo que tem de arrancar sempre, e
 * cada pacote a mais é uma forma a mais de não arrancar.
 *
 * ## Porque é que a porta está aqui e não na API
 *
 * O `api-server` não pede autenticação nenhuma. Enquanto teve endereço público,
 * qualquer pessoa que soubesse o URL lia os leads todos — nomes, telefones,
 * emails. O código dele perdeu-se e não se consegue alterar, por isso a porta
 * fecha-se aqui: este processo passa a ser a única entrada, fala com a API pela
 * rede privada do Railway, e a API deixa de estar exposta.
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const PORTA = Number(process.env.PORT ?? 8080);
const API = (process.env.API_PROXY_TARGET ?? "").replace(/\/$/, "");
const SENHA = process.env.PAINEL_SENHA ?? "";
const CHAVE = process.env.PAINEL_CHAVE ?? "";
const RAIZ = join(import.meta.dirname, "dist");

const COOKIE = "painel_sessao";
const DURACAO_MS = 30 * 24 * 60 * 60 * 1000;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
};

/* ------------------------------------------------------------- a porta */

/** Compara sem deixar que o tempo da comparação revele quanto acertou. */
function igual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function assinar(expira) {
  return createHmac("sha256", SENHA).update(String(expira)).digest("hex");
}

function bilheteValido(cookies) {
  const bilhete = cookies[COOKIE];
  if (!bilhete) return false;
  const [expira, assinatura] = bilhete.split(".");
  if (!expira || !assinatura) return false;
  if (Number(expira) < Date.now()) return false;
  return igual(assinatura, assinar(expira));
}

function lerCookies(cabecalho = "") {
  return Object.fromEntries(
    cabecalho
      .split(";")
      .map((p) => p.trim().split("="))
      .filter(([k, v]) => k && v)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))]),
  );
}

async function corpoDe(req) {
  const partes = [];
  for await (const p of req) partes.push(p);
  return Buffer.concat(partes);
}

const PAGINA_ENTRADA = (erro) => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DuoAI</title>
<style>
  :root { color-scheme: light dark; --fundo:#F6F7F9; --cartao:#fff; --borda:#E3E6EB; --texto:#14181F; --suave:#667085; --marca:#0F766E; }
  @media (prefers-color-scheme: dark) { :root { --fundo:#0D1117; --cartao:#161B22; --borda:#2A313C; --texto:#E6EDF3; --suave:#9198A1; --marca:#14B8A6; } }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; padding:24px;
         background:var(--fundo); color:var(--texto);
         font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  form { width:100%; max-width:360px; background:var(--cartao); border:1px solid var(--borda);
         border-radius:14px; padding:24px; display:grid; gap:14px; }
  h1 { margin:0; font-size:17px; }
  p { margin:0; font-size:13px; color:var(--suave); line-height:1.5; }
  input { width:100%; box-sizing:border-box; padding:11px 12px; font-size:16px; border-radius:9px;
          border:1px solid var(--borda); background:var(--fundo); color:var(--texto); }
  button { padding:11px; font-size:15px; font-weight:600; border:0; border-radius:9px;
           background:var(--marca); color:#fff; cursor:pointer; }
  .erro { color:#B42318; font-size:13px; }
</style></head>
<body><form method="post" action="/entrar">
  <h1>DuoAI · FourLife</h1>
  <p>Este painel mostra os contactos dos leads. A senha é o que os separa de quem passar pelo endereço.</p>
  <input type="password" name="senha" placeholder="Senha" autofocus autocomplete="current-password" required>
  ${erro ? '<p class="erro">Senha errada.</p>' : ""}
  <button type="submit">Entrar</button>
</form></body></html>`;

/* ------------------------------------------------------------- o proxy */

async function encaminhar(req, res) {
  if (!API) {
    res.writeHead(502, { "content-type": "application/json" });
    return res.end(JSON.stringify({ error: "API_PROXY_TARGET não está definido neste serviço" }));
  }
  const corpo = req.method === "GET" || req.method === "HEAD" ? undefined : await corpoDe(req);

  const cabecalhos = { ...req.headers };
  delete cabecalhos.host;
  delete cabecalhos["content-length"];
  delete cabecalhos.cookie; // o bilhete é desta porta, não da API

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

/* ------------------------------------------------------------ o servidor */

createServer(async (req, res) => {
  const caminhoPedido = req.url.split("?")[0];

  // A verificação de saúde do Railway tem de passar sempre, senão o serviço
  // nunca fica de pé e ninguém chega à página de entrada.
  if (caminhoPedido === "/saude") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }

  // O service worker também passa sem senha, e por uma razão precisa: o browser
  // vai buscá-lo por sua conta, fora de qualquer sessão, para ver se há versão
  // nova. Se lhe respondêssemos com a página de entrada, ele recusava o ficheiro
  // por não ser JavaScript e o service worker antigo ficava lá para sempre, a
  // servir o painel de antes a partir do cache do telemóvel. Não revela nada:
  // este ficheiro só apaga caches e se desregista.
  if (caminhoPedido === "/sw.js") {
    return servir(res, join(RAIZ, "sw.js"), "no-cache");
  }

  const cookies = lerCookies(req.headers.cookie);
  const comBilhete = !SENHA || bilheteValido(cookies);
  const comChave = CHAVE && igual(req.headers["x-chave"] ?? "", CHAVE);
  const entrou = comBilhete || comChave;

  if (req.method === "POST" && caminhoPedido === "/entrar") {
    const dados = new URLSearchParams((await corpoDe(req)).toString());
    if (SENHA && igual(dados.get("senha") ?? "", SENHA)) {
      const expira = Date.now() + DURACAO_MS;
      res.writeHead(303, {
        location: "/",
        "set-cookie": `${COOKIE}=${expira}.${assinar(expira)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DURACAO_MS / 1000}`,
      });
      return res.end();
    }
    res.writeHead(401, { "content-type": TIPOS[".html"] });
    return res.end(PAGINA_ENTRADA(true));
  }

  if (caminhoPedido === "/sair") {
    res.writeHead(303, { location: "/", "set-cookie": `${COOKIE}=; Path=/; Max-Age=0` });
    return res.end();
  }

  if (!entrou) {
    // Aos pedidos de dados responde-se 401 em JSON: o painel percebe e recarrega,
    // o que traz a página de entrada sem enganar quem está a ler a resposta.
    if (caminhoPedido.startsWith("/api")) {
      res.writeHead(401, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: "sessão terminada" }));
    }
    res.writeHead(401, { "content-type": TIPOS[".html"] });
    return res.end(PAGINA_ENTRADA(false));
  }

  if (caminhoPedido.startsWith("/api")) return encaminhar(req, res);

  // normalize impede que ".." saia da pasta dist.
  const pedido = normalize(decodeURIComponent(caminhoPedido)).replace(/^(\.\.[/\\])+/, "");
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

  /* Um caminho com extensão é um ficheiro, não uma rota do painel. Se não
     existe, responde-se 404 em vez de devolver o index disfarçado de ficheiro:
     senão o browser tenta ler HTML como se fosse uma letra ou uma imagem e
     enche a consola de erros. É o que acontece com a Ragick enquanto o ficheiro
     dela não estiver em public/tipos/. */
  if (/\.[a-z0-9]{2,5}$/i.test(pedido)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    return res.end("não existe");
  }

  return servir(res, join(RAIZ, "index.html"), "no-cache");
}).listen(PORTA, () => {
  console.log(`painel em :${PORTA} — API em ${API || "(por definir)"} — senha ${SENHA ? "activa" : "DESLIGADA"}`);
});
