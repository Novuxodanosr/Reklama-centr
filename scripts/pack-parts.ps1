# Режет deploy/ на zip-части до ~8 МБ для загрузки через файловый менеджер DirectAdmin (лимит 10 МБ на файл).
# Пути внутри архива — через «/». Папки с медиа (works, clients, video, letters, _img, img-sys, ig) не пакуются:
# они уже на хостинге и не меняются при пересборке.
# Запуск: powershell -File scripts/pack-parts.ps1 [deploy] [deploy-parts] [МБ]
param([string]$Source = "deploy", [string]$OutDir = "deploy-parts", [int]$MaxMB = 8)
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$src = (Resolve-Path $Source).Path.TrimEnd('\') + '\'
if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory -Path $OutDir | Out-Null
$skip = @('works', 'clients', 'video', 'letters', '_img', 'img-sys', 'ig')
$files = Get-ChildItem -LiteralPath $src -Recurse -File -Force | Where-Object {
  $rel = $_.FullName.Substring($src.Length)
  $top = $rel.Split('\')[0]
  $skip -notcontains $top
} | Sort-Object FullName

# Оценка сжатого размера: webp/png/jpg/woff2/mp4 почти не жмутся, текст — примерно в 3 раза.
function Est($f) {
  if ($f.Extension -match '^\.(webp|png|jpe?g|gif|woff2?|mp4|ico|zip)$') { return $f.Length }
  return [math]::Max(200, $f.Length / 3.2)
}
$limit = $MaxMB * 1MB
$part = 0; $acc = 0; $zip = $null
function NewPart {
  $script:part++
  $name = Join-Path $OutDir ("part{0:00}.zip" -f $script:part)
  $script:zip = [IO.Compression.ZipFile]::Open($name, 'Create')
  $script:acc = 0
}
NewPart
foreach ($f in $files) {
  $e = Est $f
  if ($acc -gt 0 -and ($acc + $e) -gt $limit) { $zip.Dispose(); NewPart }
  $name = $f.FullName.Substring($src.Length).Replace('\', '/')
  [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $name, 'Optimal')
  $acc += $e
}
$zip.Dispose()
Get-ChildItem $OutDir | ForEach-Object { "{0}  {1:N1} MB" -f $_.Name, ($_.Length / 1MB) }
