// Curated auth conventions for widely-used APIs.
//
// Two jobs:
//   1. Ground the diagnosis prompt, so the model does not have to guess how a
//      known host expects its key (e.g. OpenWeather wants `?appid=`, not an
//      Authorization header).
//   2. Sanity-check the model's proposed one-click fix afterwards.
//
// Last reviewed: 2026-10-11
//
// Keep this list conservative: only add an entry when the convention is
// well-documented and stable, and set `verified` to the date it was checked
// against the provider's official docs. A wrong entry is worse than no entry,
// because it would actively mislead the model. Entries that cannot be sourced
// are kept commented out at the bottom (quarantined) rather than matched.

export type ExpectedAuth =
  // Secret travels in a header. `names` stays lowercase.
  | { kind: "header"; names: string[]; prefix?: string }
  // Secret travels in a URL query parameter.
  | { kind: "query"; params: string[] }
  // HTTP Basic auth (username + password).
  | { kind: "basic" }
  // Secret is embedded directly in the URL path (e.g. Telegram bots).
  | { kind: "url" }
  // Public endpoint — takes no credentials.
  | { kind: "none" };

export type AuthHint = {
  // Base host; matched exactly or as a subdomain suffix.
  host: string;
  // Injected verbatim into the prompt as an authoritative convention note.
  note: string;
  expected: ExpectedAuth;
  // Date this entry was last checked against the provider's official docs.
  // Absent means "not re-verified" - do not treat it as authoritative.
  verified?: string;
};

export const AUTH_HINTS_LAST_REVIEWED = "2026-10-11";

const HINTS: AuthHint[] = [
  {
    host: "openweathermap.org",
    note: "OpenWeather expects the API key in the `appid` query parameter. It does NOT use an Authorization header.",
    expected: { kind: "query", params: ["appid"] },
    verified: "2026-10-11",
  },
  {
    host: "stripe.com",
    note: "Stripe expects `Authorization: Bearer <secret key>` (e.g. sk_live_...).",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "github.com",
    note: "GitHub accepts `Authorization: Bearer <token>` (also `Authorization: token <token>`, or `?access_token=`).",
    expected: { kind: "header", names: ["authorization"] },
  },
  {
    host: "openai.com",
    note: "OpenAI expects `Authorization: Bearer sk-...`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "anthropic.com",
    note: "Anthropic expects the key in the `x-api-key` header (and requires an `anthropic-version` header).",
    expected: { kind: "header", names: ["x-api-key"] },
  },
  {
    host: "cohere.ai",
    note: "Cohere expects `Authorization: Bearer <key>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
    verified: "2026-10-11",
  },
  {
    host: "cohere.com",
    note: "Cohere expects `Authorization: Bearer <key>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
    verified: "2026-10-11",
  },
  {
    host: "mapbox.com",
    note: "Mapbox expects the access token in the `access_token` query parameter (or `Authorization: Bearer`).",
    expected: { kind: "query", params: ["access_token"] },
  },
  {
    host: "nytimes.com",
    note: "The New York Times APIs expect the key in the `api-key` query parameter.",
    expected: { kind: "query", params: ["api-key"] },
  },
  {
    host: "themoviedb.org",
    note: "TMDb recommends `Authorization: Bearer <API Read Access Token>` (works for v3 and v4); a legacy v3 `api_key` query parameter is also accepted.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
    verified: "2026-10-11",
  },
  {
    host: "unsplash.com",
    note: "Unsplash expects `Authorization: Client-ID <access key>` (or `?client_id=`).",
    expected: { kind: "header", names: ["authorization"], prefix: "Client-ID" },
  },
  {
    host: "slack.com",
    note: "Slack expects `Authorization: Bearer <token>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "notion.com",
    note: "Notion expects `Authorization: Bearer <token>` plus a `Notion-Version` header.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "airtable.com",
    note: "Airtable expects `Authorization: Bearer <token>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "sendgrid.com",
    note: "SendGrid expects `Authorization: Bearer <key>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "mailgun.net",
    note: "Mailgun uses HTTP Basic auth: username `api`, password = your private API key.",
    expected: { kind: "basic" },
    verified: "2026-10-11",
  },
  {
    host: "twilio.com",
    note: "Twilio uses HTTP Basic auth: API key SID as username and API key secret as password (or, for local testing, Account SID as username and Auth Token as password).",
    expected: { kind: "basic" },
    verified: "2026-10-11",
  },
  {
    host: "spotify.com",
    note: "Spotify expects `Authorization: Bearer <token>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "reddit.com",
    note: "Reddit's OAuth API expects `Authorization: Bearer <token>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "discord.com",
    note: "Discord bot calls expect `Authorization: Bot <token>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bot" },
    verified: "2026-10-11",
  },
  {
    host: "telegram.org",
    note: "Telegram puts the bot token directly in the URL path: `/bot<token>/<method>`.",
    expected: { kind: "url" },
  },
  {
    host: "pexels.com",
    note: "Pexels expects the key raw in `Authorization: <key>` (no scheme word).",
    expected: { kind: "header", names: ["authorization"] },
    verified: "2026-10-11",
  },
  {
    host: "assemblyai.com",
    note: "AssemblyAI expects the key raw in `Authorization: <key>` (no scheme word).",
    expected: { kind: "header", names: ["authorization"] },
    verified: "2026-10-11",
  },
  {
    host: "openrouteservice.org",
    note: "OpenRouteService expects the key raw in `Authorization: <key>` (no scheme word).",
    expected: { kind: "header", names: ["authorization"] },
  },
  {
    host: "nasa.gov",
    note: "NASA APIs generally expect the key in the `api_key` query parameter.",
    expected: { kind: "query", params: ["api_key"] },
  },
  {
    host: "newsapi.org",
    note: "NewsAPI expects the key in the `apiKey` query parameter (or the `X-Api-Key` header).",
    expected: { kind: "query", params: ["apikey"] },
  },
  {
    host: "finnhub.io",
    note: "Finnhub expects the token in the `token` query parameter (or `X-Finnhub-Token` header).",
    expected: { kind: "query", params: ["token"] },
  },
  {
    host: "alphavantage.co",
    note: "Alpha Vantage expects the key in the `apikey` query parameter.",
    expected: { kind: "query", params: ["apikey"] },
  },
  {
    host: "exchangerate.host",
    note: "exchangerate.host expects the key in the `access_key` query parameter.",
    expected: { kind: "query", params: ["access_key"] },
    verified: "2026-10-11",
  },
  {
    host: "googleapis.com",
    note: "Google APIs expect the key in the `key` query parameter (or the `x-goog-api-key` header).",
    expected: { kind: "query", params: ["key"] },
  },
  {
    host: "elevenlabs.io",
    note: "ElevenLabs expects the key in the `xi-api-key` header.",
    expected: { kind: "header", names: ["xi-api-key"] },
  },
  {
    host: "deepgram.com",
    note: "Deepgram expects `Authorization: Token <key>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Token" },
  },
  {
    host: "replicate.com",
    note: "Replicate expects `Authorization: Bearer <token>` (tokens start with r8_).",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
    verified: "2026-10-11",
  },
  {
    host: "groq.com",
    note: "Groq expects `Authorization: Bearer <key>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "mistral.ai",
    note: "Mistral expects `Authorization: Bearer <key>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "perplexity.ai",
    note: "Perplexity expects `Authorization: Bearer <key>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "together.xyz",
    note: "Together AI expects `Authorization: Bearer <key>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "huggingface.co",
    note: "Hugging Face expects `Authorization: Bearer <token>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "vercel.com",
    note: "Vercel expects `Authorization: Bearer <token>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "cloudflare.com",
    note: "Cloudflare expects `Authorization: Bearer <token>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
  {
    host: "digitalocean.com",
    note: "DigitalOcean expects `Authorization: Bearer <token>`.",
    expected: { kind: "header", names: ["authorization"], prefix: "Bearer" },
  },
];

// Quarantined: conventions that could NOT be confirmed against the provider's
// official documentation. They are intentionally NOT matched until verified, so
// the model cannot be fed a possibly-wrong convention. Re-enable one only after
// checking the docs and adding a `verified` date.
//
//   { host: "currencyapi.com", expected: { kind: "header", names: ["apikey"] } },
//   { host: "polygon.io", expected: { kind: "query", params: ["apikey"] } },
//   { host: "ipinfo.io", expected: { kind: "query", params: ["token"] } },
//   { host: "fixer.io", expected: { kind: "query", params: ["access_key"] } },
//   { host: "giphy.com", expected: { kind: "query", params: ["api_key"] } },
//   { host: "spoonacular.com", expected: { kind: "query", params: ["apikey"] } },
//   { host: "weatherbit.io", expected: { kind: "query", params: ["key"] } },

// Resolve the convention for a request URL, if this host is known. Matches the
// exact host or any subdomain of it (so `api.openweathermap.org` hits
// `openweathermap.org`), but never a look-alike host such as
// `openweathermap.org.evil.com`.
export function authHintForUrl(url: string): AuthHint | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const hint of HINTS) {
    if (host === hint.host || host.endsWith(`.${hint.host}`)) return hint;
  }
  return null;
}
