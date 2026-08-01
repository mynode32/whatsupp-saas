import "server-only";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type MetaPageCandidate = {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  instagramAccountId: string;
  instagramUsername: string | null;
};

async function graphFetch<T>(path: string, params: Record<string, string>, method: "GET" | "POST" = "GET"): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url.toString(), { method });
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(body.error?.message ?? `Meta Graph API error (${res.status})`);
  }
  return body as T;
}

export async function exchangeCodeForUserToken(code: string, redirectUri: string, appId: string, appSecret: string) {
  const data = await graphFetch<{ access_token: string }>("/oauth/access_token", {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  return data.access_token;
}

/** Facebook user tokens default to a ~1-2h lifetime; exchange for the ~60-day long-lived version. */
export async function exchangeForLongLivedToken(shortLivedToken: string, appId: string, appSecret: string) {
  const data = await graphFetch<{ access_token: string }>("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });
  return data.access_token;
}

/** Every Facebook Page the user manages that has a linked Instagram Business account. */
export async function fetchInstagramCandidates(userAccessToken: string): Promise<MetaPageCandidate[]> {
  const pages = await graphFetch<{ data: Array<{ id: string; name: string; access_token: string }> }>("/me/accounts", {
    access_token: userAccessToken,
    fields: "id,name,access_token",
  });

  const candidates: MetaPageCandidate[] = [];
  for (const page of pages.data) {
    const detail = await graphFetch<{ instagram_business_account?: { id: string; username?: string } }>(`/${page.id}`, {
      access_token: page.access_token,
      fields: "instagram_business_account{id,username}",
    });
    if (detail.instagram_business_account) {
      candidates.push({
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        instagramAccountId: detail.instagram_business_account.id,
        instagramUsername: detail.instagram_business_account.username ?? null,
      });
    }
  }
  return candidates;
}

/** Tells Meta to start delivering this Page's Instagram DMs to our webhook. */
export async function subscribePageToMessaging(pageId: string, pageAccessToken: string) {
  await graphFetch(`/${pageId}/subscribed_apps`, { subscribed_fields: "messages", access_token: pageAccessToken }, "POST");
}
