const ALBION_EAST_API =
  "https://east.albion-online-data.com/api/v2/stats/prices";

const ALLOWED_CITIES = new Set([
  "Lymhurst",
  "Bridgewatch",
  "Martlock",
  "Thetford",
  "Fort Sterling",
  "Caerleon",
  "Brecilien"
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=30"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/prices") {
      return handlePrices(url);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handlePrices(url) {
  const item = url.searchParams.get("item")?.trim();
  const locationsParam = url.searchParams.get("locations")?.trim();
  const qualities = url.searchParams.get("qualities")?.trim();

  if (!item) {
    return json({ error: "Missing item parameter." }, 400);
  }

  if (!/^[A-Za-z0-9_:@.-]{1,120}$/.test(item)) {
    return json({ error: "Invalid item ID." }, 400);
  }

  const locations = (locationsParam ||
    Array.from(ALLOWED_CITIES).join(","))
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

  const invalidCity = locations.find(
    city => !ALLOWED_CITIES.has(city)
  );

  if (invalidCity) {
    return json({
      error: `Unsupported city: ${invalidCity}`
    }, 400);
  }

  if (qualities && !/^[1-5](,[1-5])*$/.test(qualities)) {
    return json({
      error: "Invalid qualities parameter."
    }, 400);
  }

  const upstream = new URL(
    `${ALBION_EAST_API}/${encodeURIComponent(item)}.json`
  );

  upstream.searchParams.set(
    "locations",
    locations.join(",")
  );

  if (qualities) {
    upstream.searchParams.set(
      "qualities",
      qualities
    );
  }

  try {
    const response = await fetch(upstream.toString(), {
      headers: {
        accept: "application/json",
        "user-agent": "Albion-Production-Base/1.0"
      }
    });

    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ||
          "application/json; charset=utf-8",
        "cache-control": "public, max-age=30"
      }
    });
  } catch (error) {
    return json({
      error: "Unable to reach Albion East market API."
    }, 502);
  }
}
