/* global URL, Request, Response */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../public/_worker.js";

function makeEnv() {
  const requests = [];
  return {
    requests,
    env: {
      ASSETS: {
        fetch(request) {
          const url = new URL(request.url ?? request);
          requests.push(url.pathname);
          return new Response(url.pathname, { status: 200 });
        },
      },
    },
  };
}

test("public host keeps the catalog manifest and landing page", async () => {
  const { env, requests } = makeEnv();
  const manifest = await worker.fetch(new Request("https://www.nutrigon.ar/manifest.webmanifest"), env);
  const landing = await worker.fetch(new Request("https://www.nutrigon.ar/"), env);

  assert.equal(await manifest.text(), "/manifest.webmanifest");
  assert.equal(await landing.text(), "/");
  assert.deepEqual(requests, ["/manifest.webmanifest", "/"]);
});

test("staff host receives its own manifest at the existing manifest URL", async () => {
  const { env, requests } = makeEnv();
  const response = await worker.fetch(
    new Request("https://admin.nutrigon.ar/manifest.webmanifest"),
    env
  );

  assert.equal(await response.text(), "/admin.webmanifest");
  assert.deepEqual(requests, ["/admin.webmanifest"]);
});

test("staff domain root opens the protected admin entry", async () => {
  const { env, requests } = makeEnv();
  const response = await worker.fetch(new Request("https://admin.nutrigon.ar/"), env);

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://admin.nutrigon.ar/admin");
  assert.deepEqual(requests, []);
});

test("unrelated requests and lookalike hostnames pass through unchanged", async () => {
  const { env, requests } = makeEnv();
  const adminPage = await worker.fetch(new Request("https://admin.nutrigon.ar/admin/login"), env);
  const lookalike = await worker.fetch(
    new Request("https://admin.nutrigon.ar.example.com/manifest.webmanifest"),
    env
  );

  assert.equal(await adminPage.text(), "/admin/login");
  assert.equal(await lookalike.text(), "/manifest.webmanifest");
  assert.deepEqual(requests, ["/admin/login", "/manifest.webmanifest"]);
});

test("staff manifest starts within the protected admin route and uses existing icons", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../public/admin.webmanifest", import.meta.url), "utf8")
  );

  assert.equal(manifest.id, "/admin");
  assert.equal(manifest.start_url, "/admin");
  assert.equal(manifest.scope, "/admin");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
});

test("only entry and manifest requests invoke the Pages Worker", async () => {
  const routes = JSON.parse(await readFile(new URL("../public/_routes.json", import.meta.url)));

  assert.deepEqual(routes.include, ["/", "/manifest.webmanifest"]);
  assert.deepEqual(routes.exclude, []);
});
