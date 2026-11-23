# VIETNAM LIFE 3D — build Hanoi Blender scene safely on Windows.
# Put this script next to blender_finalize_hanoi.py inside tools/.
param(
  [string]$SourceBlend = "",
  [string]$BlenderExe = ""
)
$ErrorActionPreference = "Stop"
$scriptPath = Join-Path $PSScriptRoot "blender_finalize_hanoi.py"
$projectRoot = Split-Path $PSScriptRoot -Parent

if ([string]::IsNullOrWhiteSpace($SourceBlend)) {
  $SourceBlend = Join-Path $projectRoot "VIETNAM_LIFE_3D_HANOI_WORLD.blend"
}
if (-not (Test-Path $SourceBlend)) {
  Write-Host "KHONG TIM THAY FILE: $SourceBlend" -ForegroundColor Red
  Write-Host 'Copy file .blend cua ban vao thu muc goc repo, hoac chay:' -ForegroundColor Yellow
  Write-Host '.\tools\run_blender_windows.ps1 -SourceBlend "C:\duong-dan\VIETNAM_LIFE_3D_HANOI_WORLD.blend"'
  exit 1
}
if (-not (Test-Path $scriptPath)) { throw "Missing script: $scriptPath" }

if ([string]::IsNullOrWhiteSpace($BlenderExe)) {
  $found = Get-Command blender.exe -ErrorAction SilentlyContinue
  if ($found) { $BlenderExe = $found.Source }
}
if ([string]::IsNullOrWhiteSpace($BlenderExe)) {
  $installRoot = Join-Path $env:ProgramFiles 'Blender Foundation'
  if (Test-Path $installRoot) {
    $found = Get-ChildItem -Path $installRoot -Filter blender.exe -File -Recurse -ErrorAction SilentlyContinue |
      Sort-Object FullName -Descending | Select-Object -First 1
    if ($found) { $BlenderExe = $found.FullName }
  }
}
if ([string]::IsNullOrWhiteSpace($BlenderExe) -or -not (Test-Path $BlenderExe)) {
  throw "Khong tim thay blender.exe. Chi dinh -BlenderExe 'C:\Program Files\Blender Foundation\Blender 5.3\blender.exe'"
}
$sourceFull = (Resolve-Path $SourceBlend).Path
Write-Host "Blender: $BlenderExe"
Write-Host "Source: $sourceFull"
Write-Host "Output: $(Join-Path (Split-Path $sourceFull -Parent) 'HANOI_WORLD_V04_OUTPUT')"
Write-Host 'File goc se duoc giu nguyen.' -ForegroundColor Green

& $BlenderExe --background $sourceFull --python-exit-code 1 --python $scriptPath
if ($LASTEXITCODE -ne 0) { throw "Blender stopped with code $LASTEXITCODE. Read terminal output to locate the problem." }
Write-Host "Done. Open folder HANOI_WORLD_V04_OUTPUT beside the original .blend file." -ForegroundColor Green
