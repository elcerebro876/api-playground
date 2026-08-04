export async function POST(request) {
  const start = Date.now();
  try {
    const { method, url, headers, body } = await request.json();
    const res = await fetch(url, { method, headers, body: body || undefined });
    const resBody = await res.text();
    const elapsed = Date.now() - start;
    return Response.json({
      status: res.status,
      ok: res.ok,
      time: elapsed,
      headers: Object.fromEntries(res.headers.entries()),
      body: resBody,
    });
  } catch (e) {
    const elapsed = Date.now() - start;
    return Response.json({ error: e.message, time: elapsed }, { status: 500 });
  }
}
