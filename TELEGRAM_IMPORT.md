# Telegram 导出资源接入

## 1) 在 Telegram Desktop 导出频道数据

1. 打开目标频道
2. 进入 `Settings -> Advanced -> Export Telegram data`
3. 选择导出该频道消息，格式选择 `JSON`
4. 导出后会得到一个目录，通常包含 `result.json`

## 2) 导入到站点数据

在项目根目录执行：

```bash
node scripts/import-telegram-export.mjs --input "你的导出目录或result.json路径"
```

默认输出文件：`telegram-resources.json`

可自定义输出：

```bash
node scripts/import-telegram-export.mjs --input "D:\\exports\\channel" --output "telegram-resources.json"
```

## 3) 重新部署

按固化流程：先推 GitHub，再发 Netlify。

```bash
git add telegram-resources.json
git commit -m "data: import telegram channel resources"
git push
npx netlify-cli deploy --prod --dir "."
```

## 说明

- 导入脚本会过滤毒师宇宙相关关键词（Breaking Bad / Better Call Saul / 绝命毒师 / 风骚律师 等）。
- 脚本会提取文本内 URL、附件文件名、时间、频道名，并按资源类型粗分类。
