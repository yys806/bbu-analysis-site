import { writeFile } from "node:fs/promises";

const shows = [
  { id: "bb", name: "Breaking Bad", showId: 169, title: "绝命毒师" },
  { id: "bcs", name: "Better Call Saul", showId: 618, title: "风骚律师" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function translateToZh(text) {
  if (!text) {
    return "";
  }

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return "";
    }
    const data = await response.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      return "";
    }
    return data[0].map((chunk) => chunk[0]).join("").trim();
  } catch {
    return "";
  }
}

function playbackLinks(showName, title, season, episode) {
  const keyword = `${showName} S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")} ${title}`;
  return {
    justwatch: `https://www.justwatch.com/us/search?q=${encodeURIComponent(keyword)}`,
    youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword + " full episode")}`,
  };
}

async function fetchEpisodes(show) {
  const response = await fetch(`https://api.tvmaze.com/shows/${show.showId}/episodes`);
  if (!response.ok) {
    throw new Error(`拉取 ${show.name} 失败`);
  }
  const episodes = await response.json();

  const result = [];
  for (const item of episodes) {
    const summaryEn = stripHtml(item.summary || "");
    const summaryZh = summaryEn ? await translateToZh(summaryEn) : "";

    result.push({
      season: item.season,
      number: item.number,
      title: item.name,
      airDate: item.airdate,
      detailUrl: item.url,
      image: item.image?.original || item.image?.medium || "",
      summaryEn,
      summaryZh,
      playback: playbackLinks(show.name, item.name, item.season, item.number),
    });

    await sleep(120);
  }

  return result;
}

async function main() {
  const payload = {};

  for (const show of shows) {
    payload[show.id] = {
      title: show.title,
      subtitle: show.name,
      episodes: await fetchEpisodes(show),
    };
  }

  await writeFile("episodes-data.json", JSON.stringify(payload, null, 2), "utf8");
  console.log("episodes-data.json generated");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
