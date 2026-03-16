import { writeFile } from "node:fs/promises";

const apiKey = process.env.OMDB_API_KEY;

if (!apiKey) {
  console.error("Missing OMDB_API_KEY environment variable");
  process.exit(1);
}

const shows = [
  { id: "bb", imdbId: "tt0903747", seasons: [7, 13, 13, 13, 16] },
  { id: "bcs", imdbId: "tt3032476", seasons: [10, 10, 10, 10, 10, 13] },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseRating(raw) {
  if (!raw || raw === "N/A") {
    return null;
  }
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

function parseVotes(raw) {
  if (!raw || raw === "N/A") {
    return "";
  }
  return raw.replaceAll(",", "");
}

async function fetchEpisodeRating(imdbId, season, episode) {
  const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbId}&Season=${season}&Episode=${episode}`;
  const response = await fetch(url);
  if (!response.ok) {
    return { rating: null, votes: "" };
  }
  const data = await response.json();
  if (data.Response === "False") {
    return { rating: null, votes: "" };
  }

  return {
    rating: parseRating(data.imdbRating),
    votes: parseVotes(data.imdbVotes),
    title: data.Title || "",
  };
}

async function main() {
  const output = {};

  for (const show of shows) {
    for (let season = 1; season <= show.seasons.length; season += 1) {
      const episodesInSeason = show.seasons[season - 1];
      for (let episode = 1; episode <= episodesInSeason; episode += 1) {
        const key = `${show.id}-${season}-${episode}`;
        output[key] = await fetchEpisodeRating(show.imdbId, season, episode);
        await sleep(80);
      }
    }
  }

  await writeFile("imdb-ratings.json", `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Generated imdb-ratings.json with ${Object.keys(output).length} items`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
