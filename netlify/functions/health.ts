import { getGeoapifyApiKey } from "../lib/geoapify";

// GET /api/health — confirms the functions are running and the Geoapify key is set.
// Never returns the key itself; only the names of variables that look related,
// which helps spot typos like "GEOAPIFY_KEY" or a stray space.
export default async function handler(
  _request: Request,
  context: { deploy?: { id?: string; context?: string } },
): Promise<Response> {
  const similarVariableNames = Object.keys(process.env).filter((name) =>
    /geo|apify/i.test(name),
  );

  return Response.json({
    ok: true,
    geoapifyKeyConfigured: Boolean(getGeoapifyApiKey()),
    similarVariableNames,
    deployId: context.deploy?.id ?? null,
    deployContext: context.deploy?.context ?? null,
  });
}
