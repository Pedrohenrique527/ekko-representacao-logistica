import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/", authenticated = false) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const headers = { accept: "text/html" };
  if (authenticated) headers["oai-authenticated-user-email"] = "pessoalpedro5@gmail.com";
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the Ekko corporate application", async () => {
  const response = await render("/", true);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Ekko Representa(?:ção|\u00e7\u00e3o) Log(?:ística|\u00edstica)/i);
  assert.match(html, /Pedro Mariniello/i);
  assert.doesNotMatch(html, /LogiSight|Your site is taking shape|Codex is working/i);
});

test("renders the branded login", async () => {
  const response = await render("/login");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Pedro Mariniello/i);
  assert.match(html, /Acesso corporativo/i);
  assert.match(html, /Entrar com Google \/ ChatGPT/i);
  assert.doesNotMatch(html, /type="password"/i);
});

test("redirects anonymous visitors to login", async () => {
  const response = await render();
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location"), "http://localhost").pathname, "/login");
});
