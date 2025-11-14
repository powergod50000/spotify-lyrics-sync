module.exports = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      res.status(400).json({ error: "Missing Genius URL (?url=...)" });
      return;
    }

    // Fetch the Genius page HTML
    const response = await fetch(url);
    if (!response.ok) {
      res.status(500).json({ error: "Failed to fetch Genius page" });
      return;
    }

    const html = await response.text();

    // Grab all <div data-lyrics-container="true">...</div> blocks
    const blocks = html.match(/<div[^>]+data-lyrics-container="true"[^>]*>[\s\S]*?<\/div>/g);
    if (!blocks || !blocks.length) {
      res.status(404).json({ error: "No lyrics containers found" });
      return;
    }

    // Strip HTML tags and some common entities
    const decodeEntities = (str) =>
      str
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ");

    let lyrics = "";
    for (const block of blocks) {
      // Remove tags
      const textOnly = block.replace(/<[^>]+>/g, "");
      lyrics += decodeEntities(textOnly).trim() + "\n\n";
    }

    if (!lyrics.trim()) {
      res.status(404).json({ error: "Lyrics text empty after parsing" });
      return;
    }

    res.status(200).json({ lyrics: lyrics.trim() });
  } catch (err) {
    console.error("Lyrics API error:", err);
    res.status(500).json({ error: "Server error", details: String(err) });
  }
};
