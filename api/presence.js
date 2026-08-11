const { kv } = require("@vercel/kv");

const KEY = "chai-adda:presence";
const STALE_MS = 30_000;

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  try {
    const now = Date.now();

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const id = body && typeof body.id === "string" ? body.id.slice(0, 64) : null;
      if (!id) {
        res.status(400).json({ error: "missing id" });
        return;
      }
      await kv.zadd(KEY, { score: now, member: id });
    }

    await kv.zremrangebyscore(KEY, 0, now - STALE_MS);
    const count = await kv.zcard(KEY);

    res.status(200).json({ count: Math.max(count, req.method === "POST" ? 1 : 0) });
  } catch (err) {
    res.status(500).json({ error: "presence unavailable" });
  }
};
