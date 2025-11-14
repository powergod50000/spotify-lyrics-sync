// api/lyrics.js

const AUDD_API_TOKEN = "f13f3510f68ecdbb925712078df293c9";

module.exports = async (req, res) => {
  try {
    const { title, artist } = req.query;

    if (!title || !artist) {
      res.status(400).json({ error: "Missing title or artist query params" });
      return;
    }

    const query = `${title} ${artist}`;

    // Build POST body for AudD
    const formData = new URLSearchParams({
      api_token: AUDD_API_TOKEN,
      method: "findLyrics",
      q: query,
    });

    // Make request to AudD
    const auddResp = await fetch("https://api.audd.io/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!auddResp.ok) {
      const bodyText = await auddResp.text().catch(() => "");
      res.status(auddResp.status).json({
        error: "AudD request failed",
        status: auddResp.status,
        body: bodyText.slice(0, 300),
      });
      return;
    }

    const auddJson = await auddResp.json();
    const results = auddJson.result || [];

    if (!Array.isArray(results) || results.length === 0) {
      res.status(404).json({ error: "No lyrics found in AudD" });
      return;
    }

    const entry = results[0];
    const lyrics = entry.lyrics;

    if (!lyrics || !lyrics.trim()) {
      res.status(404).json({ error: "Lyrics field empty in AudD result" });
      return;
    }

    res.status(200).json({ lyrics: lyrics.trim() });
  } catch (err) {
    console.error("AudD Lyrics API error:", err);
    res.status(500).json({
      error: "Server error",
      details: String(err),
    });
  }
};
