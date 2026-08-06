const test = require("node:test");
const assert = require("node:assert/strict");
const { server } = require("../src/index");

/** Start the server on a free port for the duration of one call. */
function withServer(fn) {
  return new Promise((resolve, reject) => {
    server.listen(0, async () => {
      const { port } = server.address();
      try {
        await fn(`http://127.0.0.1:${port}`);
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        server.close();
      }
    });
  });
}

test("/health answers ok — it used to 404, which reads as a dead server", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal(body.service, "duoai-server");
    assert.ok(typeof body.uptimeSeconds === "number");
  });
});

test("/healthz answers the same, so either spelling works for a monitor", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/healthz`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, "ok");
  });
});

test("a link with a query string still serves the app", async () => {
  // `/?utm_source=whatsapp` used to 404: the query was treated as part of the
  // filename. Anyone opening a shared link saw "not found".
  await withServer(async (base) => {
    const res = await fetch(`${base}/?utm_source=whatsapp&x=1`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") ?? "", /text\/html/);
    assert.match(await res.text(), /DuoAI/);
  });
});

test("the API route works with a query string appended too", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/b2b/generate?debug=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads: "" }),
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).count, 0);
  });
});

test("the index is served as HTML, not as octet-stream", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/index.html`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") ?? "", /text\/html/);
  });
});

test("a path that climbs out of the webapp directory is refused", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/../package.json`);
    assert.equal(res.status, 404);
  });
});

test("an unknown path says which path, instead of a bare 'not found'", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/nao-existe`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).path, "/nao-existe");
  });
});

test("HEAD on the app returns headers with no body", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/`, { method: "HEAD" });
    assert.equal(res.status, 200);
    assert.equal(await res.text(), "");
    assert.ok(Number(res.headers.get("content-length")) > 0);
  });
});

test("an oversized upload is rejected as 413, not by dying", async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/b2c/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "x".repeat(9 * 1024 * 1024),
    });
    assert.equal(res.status, 413);
    assert.match((await res.json()).error, /demasiado grande/i);
  });
});
