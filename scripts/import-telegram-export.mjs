import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const defaultOutput = "telegram-resources.json";
const showKeywords = [
  "breaking bad",
  "better call saul",
  "绝命毒师",
  "风骚律师",
  "毒师",
  "saul",
  "heisenberg",
];

function parseArgs(argv) {
  const args = { input: "", output: defaultOutput };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if ((token === "-i" || token === "--input") && argv[i + 1]) {
      args.input = argv[i + 1];
      i += 1;
      continue;
    }
    if ((token === "-o" || token === "--output") && argv[i + 1]) {
      args.output = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function extractText(raw) {
  if (typeof raw === "string") {
    return raw;
  }
  if (!Array.isArray(raw)) {
    return "";
  }
  return raw
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }
      if (part && typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .join(" ")
    .trim();
}

function extractLinks(raw) {
  const urls = [];
  const pushIfUrl = (value) => {
    if (typeof value !== "string") {
      return;
    }
    if (/^https?:\/\//i.test(value) || /^magnet:/i.test(value)) {
      urls.push(value.trim());
    }
  };

  if (typeof raw === "string") {
    const matches = raw.match(/https?:\/\/[^\s)]+/gi) || [];
    matches.forEach(pushIfUrl);
    return urls;
  }

  if (!Array.isArray(raw)) {
    return urls;
  }

  raw.forEach((part) => {
    if (typeof part === "string") {
      const matches = part.match(/https?:\/\/[^\s)]+/gi) || [];
      matches.forEach(pushIfUrl);
      return;
    }
    if (!part || typeof part !== "object") {
      return;
    }
    pushIfUrl(part.href);
    pushIfUrl(part.text);
  });

  return urls;
}

function classifyResource(text, fileName, urls) {
  const blob = `${text} ${fileName} ${urls.join(" ")}`.toLowerCase();
  if (/(\.mp4|\.mkv|\.avi|x264|x265|1080p|2160p|bluray)/.test(blob)) {
    return "video";
  }
  if (/(\.srt|\.ass|字幕|subtitles?)/.test(blob)) {
    return "subtitle";
  }
  if (/(magnet:|\.torrent|seed|bt\b)/.test(blob)) {
    return "torrent";
  }
  return "link";
}

function isRelevant(itemText, fileName, urls) {
  const blob = `${itemText} ${fileName} ${urls.join(" ")}`.toLowerCase();
  return showKeywords.some((word) => blob.includes(word));
}

function toResourceItem(message, channelName) {
  const text = extractText(message.text);
  const urls = extractLinks(message.text);
  const fileName = message.file || "";
  const relevant = isRelevant(text, fileName, urls);

  if (!relevant) {
    return null;
  }

  return {
    id: message.id,
    date: message.date || "",
    channel: channelName || message.from || "未知频道",
    text,
    file: fileName,
    mediaType: message.media_type || "",
    links: urls,
    category: classifyResource(text, fileName, urls),
  };
}

function collectMessageBundles(parsed) {
  const bundles = [];

  if (Array.isArray(parsed.messages)) {
    bundles.push({
      channel: parsed.name || "Telegram 导出",
      messages: parsed.messages,
    });
  }

  const chatList = parsed?.chats?.list;
  if (Array.isArray(chatList)) {
    chatList.forEach((chat) => {
      if (Array.isArray(chat?.messages)) {
        bundles.push({
          channel: chat.name || "频道/群组",
          messages: chat.messages,
        });
      }
    });
  }

  return bundles;
}

async function resolveInputFile(inputPath) {
  if (!inputPath) {
    return "";
  }
  const info = await stat(inputPath);
  if (info.isFile()) {
    return inputPath;
  }
  if (info.isDirectory()) {
    return path.join(inputPath, "result.json");
  }
  return "";
}

function dedupe(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = `${item.file}|${item.links.join(",")}|${item.text.slice(0, 120)}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function writeEmpty(outputPath, reason) {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "telegram-export",
    note: reason,
    items: [],
  };
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const { input, output } = parseArgs(process.argv.slice(2));
  if (!input) {
    await writeEmpty(output, "未提供 Telegram 导出路径。请使用 --input 指定 result.json 或导出目录。");
    console.log(`No input provided. Wrote empty dataset to ${output}`);
    return;
  }

  let filePath;
  try {
    filePath = await resolveInputFile(input);
  } catch {
    await writeEmpty(output, `输入路径不可用: ${input}`);
    console.log(`Input path not found. Wrote empty dataset to ${output}`);
    return;
  }

  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const bundles = collectMessageBundles(parsed);
  const resources = dedupe(
    bundles
      .flatMap((bundle) =>
        bundle.messages
          .filter((msg) => msg && msg.type === "message")
          .map((msg) => toResourceItem(msg, bundle.channel))
          .filter(Boolean)
      )
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    source: filePath,
    channel: parsed?.name || "Telegram 导出",
    total: resources.length,
    items: resources,
  };

  await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Imported ${resources.length} resources -> ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
