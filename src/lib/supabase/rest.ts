import { getSupabasePublicConfig } from "./config";

export async function checkSupabasePublicConnection() {
  const { url, publishableKey } = getSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    cache: "no-store",
  });

  return {
    ok: response.ok,
    status: response.status,
  };
}
