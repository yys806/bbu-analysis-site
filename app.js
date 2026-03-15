const seriesConfig = [
  {
    id: "bb",
    showId: 169,
    title: "绝命毒师",
    subtitle: "Breaking Bad",
  },
  {
    id: "bcs",
    showId: 618,
    title: "风骚律师",
    subtitle: "Better Call Saul",
  },
];

const analysisTemplate = [
  {
    title: "剧情推进",
    points: [
      "本集叙事主线与结构节奏（起承转合）。",
      "关键冲突的引爆与解决方式。",
      "与上一集 / 下一集的承接关系。",
    ],
  },
  {
    title: "人物弧线",
    points: [
      "主角决策的动机与代价。",
      "配角在本集的推动作用。",
      "人物心理或价值观的变化。",
    ],
  },
  {
    title: "主题与象征",
    points: [
      "本集主题关键词与情感基调。",
      "象征物或重复意象的出现。",
      "与毒师宇宙整体主题的呼应。",
    ],
  },
  {
    title: "镜头语言",
    points: [
      "关键镜头构图、运动、景别如何服务叙事。",
      "色彩、光影、声音对情绪的推动作用。",
    ],
  },
  {
    title: "宇宙联动",
    points: [
      "与另一部剧的互文 / 彩蛋。",
      "角色关系或时间线的提示。",
    ],
  },
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

function stripHtml(html) {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    .map(([season, items]) => ({
      season,
      episodes: items.sort((a, b) => a.number - b.number),
    }));
}

async function loadSeriesEpisodes(series) {
  const response = await fetch(`https://api.tvmaze.com/shows/${series.showId}/episodes`);
  if (!response.ok) {
    throw new Error(`${series.title} 数据拉取失败`);
  }
  const raw = await response.json();
  return raw.map((item) => ({
    season: item.season,
    number: item.number,
    title: item.name,
    airDate: item.airdate,
    image: item.image?.original || item.image?.medium || "",
    detailUrl: item.url,
    summary: stripHtml(item.summary),
  }));
}

function renderCounts(seriesBlocks) {
  const bbCount = seriesBlocks.find((s) => s.id === "bb")?.total || 0;
  const bcsCount = seriesBlocks.find((s) => s.id === "bcs")?.total || 0;
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

function renderSeries(seriesBlocks) {
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
          : `
            <div>
              <strong>剧照暂缺</strong>
              <p>该集暂未返回可用剧照，已保留解析结构。</p>
            </div>
          `;

        const summaryText = ep.summary || "暂无官方简介，建议补充你自己的详细解析。";

        card.innerHTML = `
          <header>
            <div>
              <h5>S${pad(ep.season)}E${pad(ep.number)} · ${ep.title}</h5>
              <small>首播日期：${ep.airDate || "未知"}</small>
            </div>
            <button class="copy-link" type="button" data-link="${id}">复制链接</button>
          </header>

          <div class="episode-meta">
            <span>剧集页：<a href="${ep.detailUrl}" target="_blank" rel="noreferrer">TVMaze</a></span>
            <span>百科：<a href="https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(ep.title + " " + series.subtitle)}" target="_blank" rel="noreferrer">Wikipedia 搜索</a></span>
            <span>编号：S${pad(ep.season)}E${pad(ep.number)}</span>
            <span>系列：${series.title}</span>
          </div>

          <div class="episode-shot">
            ${imageHtml}
          </div>
        `;

        const analysis = document.createElement("div");
        analysis.className = "analysis";

        const officialSummary = document.createElement("div");
        officialSummary.innerHTML = `
          <h6>官方剧情简介（来源：TVMaze）</h6>
          <ul><li>${summaryText}</li></ul>
        `;
        analysis.appendChild(officialSummary);

        analysisTemplate.forEach((block) => {
          const segment = document.createElement("div");
          const list = block.points.map((point) => `<li>${point}</li>`).join("");
          segment.innerHTML = `<h6>${block.title}</h6><ul>${list}</ul>`;
          analysis.appendChild(segment);
        });

        card.appendChild(analysis);
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

async function main() {
  try {
    const loaded = await Promise.all(
      seriesConfig.map(async (series) => {
        const episodes = await loadSeriesEpisodes(series);
        const seasons = groupBySeason(episodes);
        return {
          ...series,
          seasons,
          total: episodes.length,
        };
      })
    );

    renderCounts(loaded);
    renderNav(loaded);
    renderSeries(loaded);
    bindCopyLinks();
    bindSearch();
    bindToTop();
  } catch (error) {
    renderError(error instanceof Error ? error.message : "未知错误");
  }
}

main();
