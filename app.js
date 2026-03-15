const seriesConfig = [
  { id: "bb", title: "绝命毒师", subtitle: "Breaking Bad" },
  { id: "bcs", title: "风骚律师", subtitle: "Better Call Saul" },
];

const navRoot = document.getElementById("nav-root");
const seriesRoot = document.getElementById("series-root");
const searchInput = document.getElementById("episode-search");

function pad(num) {
  return String(num).padStart(2, "0");
}

function episodeId(seriesId, season, episode) {
  return `${seriesId}-s${pad(season)}e${pad(episode)}`;
}

function parseChineseNumber(input) {
  const s = (input || "").trim();
  if (/^\d+$/.test(s)) {
    return Number.parseInt(s, 10);
  }
  const map = {
    零: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  if (s === "十") {
    return 10;
  }
  if (s.startsWith("十")) {
    return 10 + (map[s.slice(1)] || 0);
  }
  if (s.endsWith("十")) {
    return (map[s[0]] || 0) * 10;
  }
  if (s.includes("十")) {
    const [a, b] = s.split("十");
    return (map[a] || 0) * 10 + (map[b] || 0);
  }
  return map[s] || 0;
}

function buildTelegramEpisodeMap(payload) {
  const map = new Map();
  const items = Array.isArray(payload?.items) ? payload.items : [];

  items.forEach((item) => {
    const text = item.text || "";
    const series = text.includes("风骚律师") ? "bcs" : text.includes("绝命毒师") ? "bb" : "";
    if (!series) {
      return;
    }

    const m = text.match(/(?:第)?\s*([0-9一二三四五六七八九十两]+)\s*季[^0-9一二三四五六七八九十两]*(?:第)?\s*([0-9一二三四五六七八九十两]+)\s*集/);
    if (!m) {
      return;
    }

    const season = parseChineseNumber(m[1]);
    const episode = parseChineseNumber(m[2]);
    if (!season || !episode) {
      return;
    }

    const key = `${series}-${season}-${episode}`;
    if (!map.has(key) && item.telegramUrl) {
      map.set(key, item.telegramUrl);
    }
  });

  return map;
}

function groupBySeason(episodes) {
  const map = new Map();
  episodes.forEach((ep) => {
    if (!map.has(ep.season)) {
      map.set(ep.season, []);
    }
    map.get(ep.season).push(ep);
  });

  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([season, eps]) => ({
      season,
      episodes: eps.sort((a, b) => a.number - b.number),
    }));
}

function renderCounts(seriesBlocks) {
  const bbCount = seriesBlocks.find((item) => item.id === "bb")?.total || 0;
  const bcsCount = seriesBlocks.find((item) => item.id === "bcs")?.total || 0;
  const total = bbCount + bcsCount;

  document.getElementById("bb-count").textContent = `${bbCount} 集`;
  document.getElementById("bcs-count").textContent = `${bcsCount} 集`;
  document.getElementById("total-count").textContent = `${total} 集`;
}

function renderNav(seriesBlocks) {
  navRoot.innerHTML = "";
  seriesBlocks.forEach((series) => {
    const nav = document.createElement("div");
    nav.className = "nav-series";
    nav.innerHTML = `<h4>${series.title}</h4>`;

    series.seasons.forEach((seasonBlock) => {
      const details = document.createElement("details");
      details.open = seasonBlock.season === 1;

      const summary = document.createElement("summary");
      summary.textContent = `第 ${seasonBlock.season} 季`;
      details.appendChild(summary);

      const links = document.createElement("div");
      seasonBlock.episodes.forEach((ep) => {
        const anchor = document.createElement("a");
        anchor.href = `#${episodeId(series.id, ep.season, ep.number)}`;
        anchor.textContent = `E${pad(ep.number)}`;
        links.appendChild(anchor);
      });

      details.appendChild(links);
      nav.appendChild(details);
    });

    navRoot.appendChild(nav);
  });
}

function renderSeries(seriesBlocks, telegramEpisodeMap) {
  seriesRoot.innerHTML = "";

  seriesBlocks.forEach((series) => {
    const section = document.createElement("section");
    section.className = "series";
    section.innerHTML = `
      <div class="series-header">
        <h3>${series.title}</h3>
        <span>${series.subtitle}</span>
      </div>
    `;

    series.seasons.forEach((seasonBlock) => {
      const seasonNode = document.createElement("div");
      seasonNode.className = "season";
      seasonNode.innerHTML = `<h4>第 ${seasonBlock.season} 季</h4>`;

      seasonBlock.episodes.forEach((ep) => {
        const id = episodeId(series.id, ep.season, ep.number);
        const card = document.createElement("article");
        card.className = "episode-card";
        card.id = id;
        card.dataset.code = `s${pad(ep.season)}e${pad(ep.number)}`;
        card.dataset.title = ep.title.toLowerCase();

        const imageHtml = ep.image
          ? `<img src="${ep.image}" alt="${ep.title} 剧照" loading="lazy" />`
          : `<div><strong>剧照暂缺</strong><p>该集暂未返回可用剧照。</p></div>`;

        const summaryZh = ep.summaryZh || "暂无中文简介";
        const summaryEn = ep.summaryEn || "No English synopsis available.";
        const tgKey = `${series.id}-${ep.season}-${ep.number}`;
        const tgUrl = telegramEpisodeMap.get(tgKey) || "";
        const tgButton = tgUrl
          ? `<a class="tg-button" href="${tgUrl}" target="_blank" rel="noreferrer">跳转 Telegram 视频</a>`
          : `<button class="tg-button" type="button" disabled>暂无 Telegram 视频</button>`;

        card.innerHTML = `
          <header>
            <div>
              <h5>S${pad(ep.season)}E${pad(ep.number)} · ${ep.title}</h5>
              <small>首播日期：${ep.airDate || "未知"}</small>
            </div>
            <button class="copy-link" type="button" data-link="${id}">复制链接</button>
          </header>

          <div class="episode-meta">
            <span>${tgButton}</span>
          </div>

          <div class="episode-shot">${imageHtml}</div>

          <div class="analysis">
            <div>
              <h6>剧情介绍（中文）</h6>
              <ul><li>${summaryZh}</li></ul>
            </div>
            <div>
              <h6>Synopsis (English)</h6>
              <ul><li>${summaryEn}</li></ul>
            </div>
          </div>
        `;

        seasonNode.appendChild(card);
      });

      section.appendChild(seasonNode);
    });

    seriesRoot.appendChild(section);
  });
}

function bindCopyLinks() {
  document.querySelectorAll(".copy-link").forEach((button) => {
    button.addEventListener("click", () => {
      const linkId = button.dataset.link;
      const url = `${window.location.origin}${window.location.pathname}#${linkId}`;
      navigator.clipboard.writeText(url).then(() => {
        button.textContent = "已复制";
        setTimeout(() => {
          button.textContent = "复制链接";
        }, 1200);
      });
    });
  });
}

function bindSearch() {
  searchInput.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    document.querySelectorAll(".episode-card").forEach((card) => {
      if (!query) {
        card.style.display = "";
        return;
      }
      const text = `${card.dataset.code} ${card.dataset.title}`;
      card.style.display = text.includes(query) ? "" : "none";
    });
  });
}

function bindToTop() {
  const button = document.getElementById("to-top");
  window.addEventListener("scroll", () => {
    button.classList.toggle("visible", window.scrollY > 500);
  });
  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function renderError(message) {
  seriesRoot.innerHTML = `
    <section class="series">
      <div class="series-header">
        <h3>数据加载失败</h3>
        <span>${message}</span>
      </div>
    </section>
  `;
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} 加载失败`);
  }
  return response.json();
}

async function main() {
  try {
    const [episodePayload, telegramPayload] = await Promise.all([
      loadJson("episodes-data.json"),
      loadJson("telegram-resources.json").catch(() => ({ items: [] })),
    ]);
    const telegramEpisodeMap = buildTelegramEpisodeMap(telegramPayload);

    const seriesBlocks = seriesConfig.map((series) => {
      const item = episodePayload[series.id];
      const episodes = item?.episodes || [];
      return {
        ...series,
        seasons: groupBySeason(episodes),
        total: episodes.length,
      };
    });

    renderCounts(seriesBlocks);
    renderNav(seriesBlocks);
    renderSeries(seriesBlocks, telegramEpisodeMap);
    bindCopyLinks();
    bindSearch();
    bindToTop();
  } catch (error) {
    renderError(error instanceof Error ? error.message : "未知错误");
  }
}

main();
