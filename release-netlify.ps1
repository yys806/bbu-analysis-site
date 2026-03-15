param(
  [string]$Branch = "main",
  [string]$PublishDir = "."
)

$ErrorActionPreference = "Stop"

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "缺少命令: $name"
  }
}

Require-Command git
Require-Command netlify

git rev-parse --is-inside-work-tree | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "当前目录不是 Git 仓库"
}

$remote = git remote
if ([string]::IsNullOrWhiteSpace($remote)) {
  throw "未配置 Git 远程仓库，请先关联 GitHub"
}

$current = git branch --show-current
if ($current -ne $Branch) {
  Write-Host "当前分支是 $current，目标分支是 $Branch"
}

Write-Host "[1/3] 推送 GitHub..."
git push origin $Branch
if ($LASTEXITCODE -ne 0) {
  throw "GitHub 推送失败"
}

Write-Host "[2/3] 检查 Netlify 登录状态..."
netlify status | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Netlify 未登录，请先执行 netlify login"
}

Write-Host "[3/3] 部署到 Netlify 生产环境..."
netlify deploy --prod --dir $PublishDir
if ($LASTEXITCODE -ne 0) {
  throw "Netlify 部署失败"
}

$sha = git rev-parse --short HEAD
Write-Host "发布完成。分支: $Branch, 提交: $sha"
