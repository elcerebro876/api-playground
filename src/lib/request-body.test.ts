import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_REQUEST_BODY_BYTES,
  formatByteSize,
  isBodyTooLarge,
  utf8ByteLength,
} from "@/lib/request-body";

test("utf8ByteLength counts multi-byte characters by their UTF-8 size", () => {
  assert.equal(utf8ByteLength("hello"), 5);
  assert.equal(utf8ByteLength("é"), 2);
  assert.equal(utf8ByteLength("😀"), 4);
});

test("bodies at the limit are allowed and one byte over is rejected", () => {
  assert.equal(MAX_REQUEST_BODY_BYTES, 8 * 1024 * 1024);
  const atLimit = "a".repeat(MAX_REQUEST_BODY_BYTES);
  assert.equal(isBodyTooLarge(atLimit), false);
  assert.equal(isBodyTooLarge(`${atLimit}a`), true);
});

test("formatByteSize uses compact units for small, medium, and large bodies", () => {
  assert.equal(formatByteSize(512), "512 B");
  assert.equal(formatByteSize(2048), "2.0 KB");
  assert.equal(formatByteSize(MAX_REQUEST_BODY_BYTES), "8.0 MB");
});
