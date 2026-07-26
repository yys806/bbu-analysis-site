# 毒师宇宙剧集导航

覆盖《绝命毒师》(Breaking Bad) 与《风骚律师》(Better Call Saul) 全剧集的静态导航站:
逐集展示集名、首播日期、剧照、中英文剧情简介、IMDb 评分,并提供跳转到 Telegram
频道视频消息的入口。

纯静态、零运行时依赖:没有构建步骤,没有 npm 依赖,直接由浏览器加载
`index.html` + `app.js` + 三个 JSON 数据文件。

## 目录结构

```
index.html                  页面骨架
styles.css                  样式(无预处理器)
app.js                      渲染逻辑(读取下方三个 JSON)
episodes-data.json          剧集元数据(TVMaze 抓取 + 机器翻译中文简介)
imdb-ratings.json           每集 IMDb 评分与票数(OMDb 抓取)
telegram-resources.json     Telegram 频道导出的视频消息索引
favicon.svg                 站点图标
scripts/                    数据管线脚本(见下)
netlify.toml                Netlify 发布配置
DEPLOY.md                   固化发布流程说明
TELEGRAM_IMPORT.md          Telegram 导出接入说明
```

## 本地预览

任意静态服务器即可,例如:

```bash
npx serve .
# 或
python -m http.server 8000
```

直接双击 `index.html`(file:// 协议)会因 fetch JSON 受限而加载失败,请务必走 http。

## 数据管线

三个脚本均为 Node 原生 ESM,无需安装依赖(Node 18+,推荐 22)。

### 1. 剧集元数据(TVMaze)

```bash
node scripts/generate-episodes-data.mjs
```

从 TVMaze API 拉取两部剧的全部剧集,附带剧照与英文简介,并调用翻译接口生成
中文简介,输出 `episodes-data.json`。

### 2. IMDb 评分(OMDb)

需要 OMDb API Key,通过环境变量传入,不要写进代码:

```bash
# PowerShell
$env:OMDB_API_KEY = "<你的key>"; node scripts/generate-imdb-ratings.mjs
# Bash
OMDB_API_KEY=<你的key> node scripts/generate-imdb-ratings.mjs
```

输出 `imdb-ratings.json`,键格式为 `bb-季-集` / `bcs-季-集`。

### 3. Telegram 频道资源

```bash
node scripts/import-telegram-export.mjs --input "Telegram导出目录或result.json路径"
```

解析 Telegram Desktop 的 JSON 导出,过滤毒师宇宙相关消息,输出
`telegram-resources.json`。详细导出步骤见 `TELEGRAM_IMPORT.md`。

脚本只会把导出文件的文件名写入 `source` 字段,不会记录本机完整路径。

## 关于 Telegram 视频链接

`telegram-resources.json` 中的链接形如 `https://t.me/c/<chatId>/<messageId>`,
指向私有频道内的消息,**仅该频道成员可以打开**;非成员访问会提示不可用,
属于预期行为。

## 部署

部署为手动流程(push 不会自动上线),见 `DEPLOY.md`:先推 GitHub,再执行
`netlify deploy --prod`。
