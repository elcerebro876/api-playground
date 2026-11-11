// Request bodies are capped on both sides of the proxy. The response reader
// uses the same ceiling, so an 8 MB request and an 8 MB response behave alike.
export const MAX_REQUEST_BODY_BYTES = 8 * 1024 * 1024;

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function isBodyTooLarge(value: string): boolean {
  return utf8ByteLength(value) > MAX_REQUEST_BODY_BYTES;
}

export function formatByteSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}
