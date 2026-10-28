param([string]$Path, [int]$Rows = 12)
Add-Type -AssemblyName System.IO.Compression.FileSystem
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$z = [IO.Compression.ZipFile]::OpenRead($Path)
function ReadEntry($name) { $e = $z.GetEntry($name); if (!$e) { return $null }; $r = New-Object IO.StreamReader($e.Open()); $t = $r.ReadToEnd(); $r.Close(); return [xml]$t }
$ss = @()
$sx = ReadEntry 'xl/sharedStrings.xml'
if ($sx) { foreach ($si in $sx.sst.si) { $ss += $si.InnerText } }
$wb = ReadEntry 'xl/workbook.xml'
"== " + (Split-Path $Path -Leaf) + " | sheets: " + (($wb.workbook.sheets.sheet | ForEach-Object { $_.name }) -join ', ')
$imgs = ($z.Entries | Where-Object { $_.FullName -like 'xl/media/*' }).Count
"images inside: $imgs"
$sh = ReadEntry 'xl/worksheets/sheet1.xml'
$n = 0
foreach ($row in $sh.worksheet.sheetData.row) {
  $vals = foreach ($c in $row.c) { $v = $c.v; if ($c.t -eq 's') { $v = $ss[[int]$v] } elseif ($c.t -eq 'inlineStr') { $v = $c.is.InnerText }; "$($c.r)=$v" }
  ($vals -join ' | ')
  $n++; if ($n -ge $Rows) { break }
}
"total rows: " + $sh.worksheet.sheetData.row.Count
$z.Dispose()
