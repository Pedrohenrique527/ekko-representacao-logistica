import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the Ekko corporate application", async () => {
  const response = await render();
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
});
