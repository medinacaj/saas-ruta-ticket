import test from "node:test";
import assert from "node:assert/strict";
import { loadDemo, saveDemo, clearDemo } from "../src/storage.mjs";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k)
};
test("los datos de demostración sobreviven a la recarga y pueden reiniciarse", () => {
  const product = "rutaticket";
  const seed = () => ({ tenants: [], tickets: [], audit: [], trips: [], cash: [] });
  assert.deepEqual(loadDemo(product, seed), seed());
  const data = seed(); data.audit.push({ action: "demo" });
  assert.equal(saveDemo(product, data), true);
  assert.equal(loadDemo(product, seed).audit[0].action, "demo");
  clearDemo(product);
  assert.equal(loadDemo(product, seed).audit.length, 0);
});
test("almacenamiento corrupto reinicia datos", () => {
  store.set("ticketing-demo:v2:rutaticket", "{invalid json");
  assert.equal(loadDemo("rutaticket", () => ({ recovered: true })).recovered, true);
});
