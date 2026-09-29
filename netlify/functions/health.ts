import { getGeoapifyApiKey } from "../lib/geoapify";

// GET /api/health — confirms the functions are running and the Geoapify key is set.
// Never returns the key itself.
export default async function handler(): Promise<Response> {
  return Response.json({
    ok: true,
    geoapifyKeyConfigured: Boolean(getGeoapifyApiKey()),
  });
}
