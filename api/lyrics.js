import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // Fetch the Genius lyrics page
    const html = await fetch(url).then(r => r.text());
    const $ = cheerio.load(html);

    // Genius stores lyrics inside <div data-lyrics-container="true">
    let lyrics = "";
    $('div[data-lyrics-container="true"]').each((i, el) => {
      lyrics += $(el).text() + "\n";
    });

    if (!lyrics.trim()) {
      return res.status(404).json({ error: "Lyrics not found" });
    }

    res.status(200).json({ lyrics });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.toString() });
  }
}
