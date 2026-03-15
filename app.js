const seriesData = [
  {
    id: "bb",
    title: "绝命毒师",
    subtitle: "Breaking Bad",
    seasons: [7, 13, 13, 13, 16],
  },
  {
    id: "bcs",
    title: "风骚律师",
    subtitle: "Better Call Saul",
    seasons: [10, 10, 10, 10, 10, 13],
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
      "本集值得截取的镜头 / 画面构图。",
      "光影、色彩、声音的叙事作用。",
      "导演风格的显著处理。",
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

const totalCounts = seriesData.reduce(
  (acc, series) => {
    const count = series.seasons.reduce((sum, season) => sum + season, 0);
    acc.total += count;
    acc.bySeries[series.id] = count;
    return acc;
  },
  { total: 0, bySeries: {} }
);

document.getElementById("bb-count").textContent = `${totalCounts.bySeries.bb} 集`;
document.getElementById("bcs-count").textContent = `${totalCounts.bySeries.bcs} 集`;
document.getElementById("total-count").textContent = `${totalCounts.total} 集`;

function pad(num) {
  return String(num).padStart(2, "0");
}

function episodeId(seriesId, season, episode) {
  return `${seriesId}-s${pad(season)}e${pad(episode)}`;
}

function expectedImagePath(seriesId, season, episode) {
  return `assets/episodes/${seriesId}/s${pad(season)}e${pad(episode)}.jpg`;
}

function renderNav() {
  seriesData.forEach((series) => {
    const nav = document.createElement("div");
    nav.className = "nav-series";
    nav.innerHTML = `<h4>${series.title}</h4>`;

    series.seasons.forEach((count, idx) => {
      const seasonNo = idx + 1;
      const details = document.createElement("details");
      details.open = seasonNo === 1;
      const summary = document.createElement("summary");
      summary.textContent = `第 ${seasonNo} 季`;
      details.appendChild(summary);

      const links = document.createElement("div");
      for (let ep = 1; ep <= count; ep += 1) {
        const anchor = document.createElement("a");
        anchor.href = `#${episodeId(series.id, seasonNo, ep)}`;
        anchor.textContent = `E${pad(ep)}`;
        links.appendChild(anchor);
      }
      details.appendChild(links);
      nav.appendChild(details);
    });

    navRoot.appendChild(nav);
  });
}

function renderSeries() {
  seriesData.forEach((series) => {
    const section = document.createElement("section");
    section.className = "series";
    section.innerHTML = `
      <div class="series-header">
        <h3>${series.title}</h3>
        <span>${series.subtitle}</span>
      </div>
    `;

    series.seasons.forEach((count, idx) => {
      const seasonNo = idx + 1;
      const seasonBlock = document.createElement("div");
      seasonBlock.className = "season";
      seasonBlock.innerHTML = `<h4>第 ${seasonNo} 季</h4>`;

      for (let ep = 1; ep <= count; ep += 1) {
        const id = episodeId(series.id, seasonNo, ep);
        const card = document.createElement("article");
        card.className = "episode-card";
        card.id = id;
        card.dataset.season = seasonNo;
        card.dataset.episode = ep;

        const titleText = `S${pad(seasonNo)}E${pad(ep)} · 待补充标题`;
        card.innerHTML = `
          <header>
            <div>
              <h5>${titleText}</h5>
              <small>集号：${pad(ep)} · 请补充正式标题与播出信息</small>
            </div>
            <button class="copy-link" type="button" data-link="${id}">复制链接</button>
          </header>
          <div class="episode-meta">
            <span>导演：待补充</span>
            <span>编剧：待补充</span>
            <span>播出日期：待补充</span>
            <span>关键词：待补充</span>
          </div>
          <div class="episode-shot" data-path="${expectedImagePath(series.id, seasonNo, ep)}">
            <div>
              <strong>剧照待补充</strong>
              <p>建议放置：${expectedImagePath(series.id, seasonNo, ep)}</p>
            </div>
          </div>
        `;

        const analysis = document.createElement("div");
        analysis.className = "analysis";
        analysisTemplate.forEach((block) => {
          const segment = document.createElement("div");
          const list = block.points.map((point) => `<li>${point}</li>`).join("");
          segment.innerHTML = `
            <h6>${block.title}</h6>
            <ul>${list}</ul>
          `;
          analysis.appendChild(segment);
        });
        card.appendChild(analysis);

        seasonBlock.appendChild(card);
      }

      section.appendChild(seasonBlock);
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
      const code = `s${pad(card.dataset.season)}e${pad(card.dataset.episode)}`;
      card.style.display = code.includes(query) ? "" : "none";
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

function hydrateImages() {
  document.querySelectorAll(".episode-shot").forEach((shot) => {
    const path = shot.dataset.path;
    const img = new Image();
    img.loading = "lazy";
    img.alt = "剧照";
    img.src = path;
    img.addEventListener("load", () => {
      shot.innerHTML = "";
      shot.appendChild(img);
    });
  });
}

renderNav();
renderSeries();
bindCopyLinks();
bindSearch();
bindToTop();
hydrateImages();
