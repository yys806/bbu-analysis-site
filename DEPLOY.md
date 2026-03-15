# GitHub -> Netlify 固化发布流程

## 标准顺序（必须）

1. 本地验证（页面可打开、无语法报错）
2. 推送到 GitHub（先于 Netlify）
3. 在 Netlify 执行生产部署

## 一次发布命令

PowerShell:

```powershell
./release-netlify.ps1 -Branch main -PublishDir .
```

Bash:

```bash
bash ./release-netlify.sh main .
```

## 说明

- 脚本会先检查当前目录是否为 Git 仓库、是否配置远程仓库。
- 脚本不会自动创建 commit（避免误提交），会直接 push 当前分支已提交内容。
- push 成功后才会执行 `netlify deploy --prod`。
- 若未登录 Netlify，请先执行 `netlify login`。

## 推荐配套

- 默认分支使用 `main`
- `netlify.toml` 中固定 publish 目录，避免手工输错
- 发布后记录：分支名、最新提交 SHA、Netlify 生产地址
