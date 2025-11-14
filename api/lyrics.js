// api/lyrics.js

const GENIUS_TOKEN = "hHrPpZvpq0eUFbSrf7uGqYx0bs1FqHxjVCsryeiOL6Ejx4I8f0yUicUIsZ7x3W9z";

module.exports = async (req, res) => {
  try {
    const { title, artist } = req.query;

    if (!title || !artist) {
      res.status(400).json({ error: "Missing title or artist query params" });
      return;
    }

    // 1) Search Genius for the song
    const searchUrl =
      "https://api.genius.com/search?q=" +
      encodeURIComponent(`${title} ${artist}`);

    const searchResp = await fetch(searchUrl, {
      headers: { Authorization: "Bearer " + GENIUS_TOKEN },
    });

    if (!searchResp.ok) {
      res
        .status(500)
        .json({ error: "Genius search failed", status: searchResp.status });
      return;
    }

    const searchJson = await searchResp.json();
    const hits = searchJson?.response?.hits || [];

    if (!hits.length) {
      res.status(404).json({ error: "No Genius hits for that song" });
      return;
    }

    const lyricPageUrl = hits[0].result.url;

    // 2) Fetch the Genius lyrics page HTML
    const pageResp = await fetch(lyricPageUrl);
    if (!pageResp.ok) {
      res
        .status(500)
        .json({ error: "Failed to fetch Genius page", status: pageResp.status });
      return;
    }

    const html = await pageResp.text();

    // 3) Extract <div data-lyrics-container="true"> blocks
    const blocks = html.match(
      /<div[^>]+data-lyrics-container="true"[^>]*>[\s\S]*?<\/div>/g
    );

    if (!blocks || !blocks.length) {
      res.status(404).json({ error: "No lyrics containers found on page" });
      return;
    }

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
      const textOnly = block.replace(/<[^>]+>/g, "");
      lyrics += decodeEntities(textOnly).trim() + "\n\n";
    }

    if (!lyrics.trim()) {
      res.status(404).json({ error: "Empty lyrics after parsing" });
      return;
    }

    res.status(200).json({ lyrics: lyrics.trim() });
  } catch (err) {
    console.error("Lyrics API error:", err);
    res.status(500).json({ error: "Server error", details: String(err) });
  }
};
