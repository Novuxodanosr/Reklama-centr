# Упаковка папки в zip с путями через «/» (Compress-Archive в Windows PowerShell 5.1 пишет «\»,
# и на Linux-хостинге вместо папок получаются файлы вида «ru\index.html»).
# Запуск: powershell -File scripts/zip.ps1 <папка> <архив.zip>
param([string]$Source, [string]$Destination)
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$src = (Resolve-Path $Source).Path.TrimEnd('\') + '\'
if (Test-Path $Destination) { Remove-Item $Destination -Force }
$zip = [IO.Compression.ZipFile]::Open($Destination, 'Create')
try {
  Get-ChildItem -LiteralPath $src -Recurse -File -Force | ForEach-Object {
    $name = $_.FullName.Substring($src.Length).Replace('\', '/')
    [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $name, 'Optimal')
  }
} finally { $zip.Dispose() }
