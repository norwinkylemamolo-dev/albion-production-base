const ALBION_EAST_API = "https://east.albion-online-data.com/api/v2/stats/prices";

const ALLOWED_CITIES = new Set([
  "Lymhurst",
  "Bridgewatch",
  "Martlock",
  "Thetford",
  "Fort Sterling",
  "Caerleon",
  "Brecilien"
]);

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=30",
      ...extraHeaders
    }
  });
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const item = url.searchParams.get("item")?.trim();
  const locationsParam = url.searchParams.get("locations")?.trim();
  const qualities = url.searchParams.get("qualities")?.trim();

  if (!item) {
    return json({ error: "Missing item parameter." }, 400);
  }

  const locations = (locationsParam || Array.from(ALLOWED_CITIES).join(","))
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

  const invalidCity = locations.find(x => !ALLOWED_CITIES.has(x));

  if (invalidCity) {
    return json({ error: `Unsupported city: ${invalidCity}` }, 400);
  }

  if (!/^[A-Za-z0-9_:@.-]{1,120}$/.test(item)) {
    return json({ error: "Invalid item ID." }, 400);
  }

  if (qualities && !/^[1-5](,[1-5])*$/.test(qualities)) {
    return json({ error: "Invalid qualities parameter." }, 400);
  }

  const upstream = new URL(
    `${ALBION_EAST_API}/${encodeURIComponent(item)}.json`
  );

  upstream.searchParams.set("locations", locations.join(","));

  if (qualities) {
    upstream.searchParams.set("qualities", qualities);
  }

  try {
    const response = await fetch(upstream.toString(), {
      headers: {
        "accept": "application/json",
        "user-agent": "Albion-Production-Base/1.0"
      },
      cf: {
        cacheTtl: 30,
        cacheEverything: true
      }
    });

    const body = await response.text();

    if (!response.ok) {
      return new Response(body || JSON.stringify({
        error: "Albion market API request failed."
      }), {
        status: response.status,
        headers: {
          "content-type":
            response.headers.get("content-type") ||
            "application/json; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }

    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=30"
      }
    });

  } catch (error) {
    return json({
      error: "Unable to reach Albion East market API."
    }, 502);
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "Content-Type"
    }
  });
}
