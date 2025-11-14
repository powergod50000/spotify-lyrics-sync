// api/lyrics.js
// No API key needed for lyrics.ovh

module.exports = async (req, res) => {
  try {
    const { title, artist } = req.query;

    if (!title || !artist) {
      res.status(400).json({ error: "Missing title or artist query params" });
      return;
    }

    // Build lyrics.ovh endpoint
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(
      artist
    )}/${encodeURIComponent(title)}`;

    const lyrResp = await fetch(url);

    if (!lyrResp.ok) {
      const txt = await lyrResp.text().catch(() => "");
      res.status(lyrResp.status).json({
        error: "lyrics.ovh request failed",
        body: txt.slice(0, 500),
      });
      return;
    }

    const data = await lyrResp.json();

    if (!data || !data.lyrics) {
      res.status(404).json({ error: "No lyrics found." });
      return;
    }

    res.status(200).json({ lyrics: data.lyrics });
  } catch (err) {
    res.status(500).json({
      error: "Server error",
      details: String(err),
    });
  }
};
