import { test } from "node:test";
import assert from "node:assert/strict";
import {
  POSTMAN_MAX_ENDPOINTS,
  POSTMAN_MAX_FOLDERS,
  folderFits,
  hasUnresolvedVariables,
  isSecretVariable,
  parsePostmanCollection,
  resolveVariables,
} from "@/lib/postman";

const collection = {
  info: {
    name: "Node health",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [{ key: "baseUrl", value: "https://api.example" }],
  item: [
    {
      name: "Auth",
      item: [
        {
          name: "Token",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            url: { raw: "{{baseUrl}}/auth/token/{{token}}" },
            body: { mode: "raw", raw: '{"user":"ada"}' },
            event: [{ listen: "test", script: { exec: ["pm.test()"] } }],
            response: [{ name: "ok" }, { name: "bad" }],
            description: "Gets a token",
          },
        },
      ],
      auth: { type: "bearer" },
    },
    {
      name: "Customer",
      item: [
        {
          name: "List",
          request: { method: "get", url: "https://api.example/customers" },
        },
        {
          name: "Upload",
          request: {
            method: "PUT",
            url: "https://api.example/customers/1/avatar",
            body: {
              mode: "formdata",
              formdata: [
                { key: "file", type: "file", src: "/tmp/a.png" },
                { key: "name", value: "Ada" },
              ],
            },
          },
        },
      ],
    },
    {
      name: "Payments",
      item: [
        {
          name: "Charge",
          request: {
            method: "DELETE",
            url: "https://api.example/payments/{{paymentId}}",
            header: [{ key: "Authorization", value: "Bearer sk_live" }],
          },
        },
      ],
    },
  ],
};

test("parses folders, requests, methods, and skipped features", () => {
  const result = parsePostmanCollection(collection);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const value = result.value;
  assert.equal(value.name, "Node health");
  assert.equal(value.folders.length, 3);
  assert.equal(value.stats.totalRequests, 4);
  assert.deepEqual(
    value.folders.map((folder) => [folder.name, folder.requests.length]),
    [
      ["Auth", 1],
      ["Customer", 2],
      ["Payments", 1],
    ],
  );
  assert.equal(value.folders[0].requests[0].method, "POST");
  assert.equal(value.folders[1].requests[0].method, "GET");
  assert.equal(value.folders[1].requests[1].method, "PUT");
  assert.equal(value.folders[2].requests[0].method, "DELETE");
  assert.equal(value.stats.scripts, 1);
  assert.equal(value.stats.examples, 2);
  assert.equal(value.stats.fileUploads, 1);
  assert.equal(value.stats.inheritedAuth, 1);
  assert.equal(value.stats.credentials, 2);
});

test("separates missing variables from secret-looking ones", () => {
  const result = parsePostmanCollection(collection);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.missingVariables, ["paymentId"]);
  assert.deepEqual(result.value.secretVariables, ["token"]);
  assert.equal(isSecretVariable("apiKey"), true);
  assert.equal(isSecretVariable("baseUrl"), false);
});

test("resolves known variables and reports unresolved placeholders", () => {
  assert.equal(
    resolveVariables("{{baseUrl}}/users/{{id}}", {
      baseUrl: "https://api.example",
    }),
    "https://api.example/users/{{id}}",
  );
  assert.equal(
    hasUnresolvedVariables("{{baseUrl}}/users/{{id}}"),
    true,
  );
  assert.equal(hasUnresolvedVariables("https://api.example/users/1"), false);
});

test("rejects non-Postman payloads and v1 exports", () => {
  assert.deepEqual(parsePostmanCollection({ hello: "world" }), {
    ok: false,
    reason: "not_postman",
  });
  assert.deepEqual(
    parsePostmanCollection({
      info: { schema: "https://schema.getpostman.com/json/collection/v1.0.0/collection.json" },
      item: [],
    }),
    { ok: false, reason: "unsupported_version" },
  );
});

test("folder fitting respects both folder and endpoint quotas", () => {
  const folder = {
    id: "f",
    name: "F",
    auth: false,
    requests: [{ id: "r" }, { id: "r2" }],
  } as unknown as Parameters<typeof folderFits>[0];
  assert.equal(folderFits(folder, 0, 0, POSTMAN_MAX_FOLDERS, POSTMAN_MAX_ENDPOINTS), true);
  assert.equal(folderFits(folder, POSTMAN_MAX_FOLDERS, 0, POSTMAN_MAX_FOLDERS, POSTMAN_MAX_ENDPOINTS), false);
  assert.equal(folderFits(folder, 0, POSTMAN_MAX_ENDPOINTS - 1, POSTMAN_MAX_FOLDERS, POSTMAN_MAX_ENDPOINTS), false);
});
