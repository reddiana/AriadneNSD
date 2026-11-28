# worktree를 Obsidian 보관함으로 등록하고 엽니다. (Obsidian은 점(.)으로 시작하는 폴더를 보여 주지 않음)
#   .\.claude\scripts\open-worktree-vault.ps1 [이름 앞부분]   고르거나 이름으로 지정해 엶
#   .\.claude\scripts\open-worktree-vault.ps1 -Remove [이름]   등록을 뺌(이름 없으면 폴더가 사라진 worktree 등록 모두)
param(
  [string]$Name,
  [switch]$Remove
)
$ErrorActionPreference = 'Stop'

$repo = (& git -C $PSScriptRoot rev-parse --path-format=absolute --git-common-dir) -replace '/', '\' | Split-Path -Parent
$wtRoot = Join-Path $repo '.claude\worktrees'
$regFile = Join-Path $env:APPDATA 'obsidian\obsidian.json'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Get-Worktrees {
  $out = @()
  $cur = $null
  foreach ($line in (& git -C $repo worktree list --porcelain)) {
    if ($line -like 'worktree *') { $cur = [ordered]@{ Path = ($line.Substring(9) -replace '/', '\'); Branch = '(detached)' }; $out += $cur }
    elseif ($line -like 'branch *' -and $cur) { $cur.Branch = $line.Substring(7) -replace '^refs/heads/', '' }
  }
  $out | Where-Object { $_.Path.StartsWith($wtRoot + '\', [StringComparison]::OrdinalIgnoreCase) } |
    ForEach-Object { [pscustomobject]@{ Name = Split-Path $_.Path -Leaf; Path = $_.Path; Branch = $_.Branch } }
}

function Read-Reg { Get-Content $regFile -Raw -Encoding UTF8 | ConvertFrom-Json }
function Save-Reg($obj) {
  $bak = Join-Path $env:TEMP ("obsidian.json.bak-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
  Copy-Item $regFile $bak
  Write-Host "obsidian.json 백업: $bak"
  [IO.File]::WriteAllText($regFile, ($obj | ConvertTo-Json -Depth 10 -Compress), $utf8)
}
function SamePath($a, $b) { $a.TrimEnd('\') -ieq $b.TrimEnd('\') }

if ($Remove) {
  $reg = Read-Reg
  $drop = @()
  foreach ($p in $reg.vaults.PSObject.Properties) {
    $path = $p.Value.path
    if (-not $path.StartsWith($wtRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { continue }
    $leaf = Split-Path $path -Leaf
    if ($Name) { if ($leaf -like "$Name*") { $drop += $p.Name } }
    elseif (-not (Test-Path -LiteralPath $path)) { $drop += $p.Name }
  }
  if (-not $drop) { Write-Host '뺄 등록이 없습니다.'; return }
  foreach ($id in $drop) { Write-Host ("뺌: " + $reg.vaults.$id.path); $reg.vaults.PSObject.Properties.Remove($id) }
  Save-Reg $reg
  if (Get-Process obsidian -ErrorAction SilentlyContinue) { Write-Host 'Obsidian이 켜져 있어 목록에는 다음에 켤 때 반영됩니다(켜져 있는 동안 덮어쓸 수 있으니 확인).' }
  return
}

$wts = @(Get-Worktrees)
if (-not $wts) { throw "$wtRoot 아래에 worktree가 없습니다." }
if ($Name) {
  $m = @($wts | Where-Object { $_.Name -like "$Name*" })
  if ($m.Count -ne 1) { throw "'$Name'에 맞는 worktree가 $($m.Count)개입니다: " + (($wts.Name) -join ', ') }
  $wt = $m[0]
} elseif ($wts.Count -eq 1) {
  $wt = $wts[0]
} else {
  for ($i = 0; $i -lt $wts.Count; $i++) { Write-Host ("{0}. {1}  [{2}]" -f ($i + 1), $wts[$i].Name, $wts[$i].Branch) }
  $n = [int](Read-Host '번호')
  if ($n -lt 1 -or $n -gt $wts.Count) { throw '번호가 범위 밖입니다.' }
  $wt = $wts[$n - 1]
}
Write-Host ("worktree: " + $wt.Path)

# 설정 복사(workspace.json 제외, 덮어씀)
& robocopy (Join-Path $repo '.obsidian') (Join-Path $wt.Path '.obsidian') /E /XF workspace.json /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy 실패($LASTEXITCODE)" }

# 보관함 등록
$reg = Read-Reg
$found = $reg.vaults.PSObject.Properties | Where-Object { SamePath $_.Value.path $wt.Path } | Select-Object -First 1
if (-not $found) {
  $id = -join ((1..16) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
  $reg.vaults | Add-Member -NotePropertyName $id -NotePropertyValue ([pscustomobject]@{ path = $wt.Path; ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() })
  Save-Reg $reg
  Write-Host "등록: $id"
} else { Write-Host "이미 등록됨: $($found.Name)" }

# 열기: 켜진 Obsidian은 실행 중에 더한 등록을 몰라서 URI가 "Vault not found" 오류 창을 띄움 → 꺼져 있을 때만 URI를 씀
if (Get-Process obsidian -ErrorAction SilentlyContinue) {
  Set-Clipboard -Value $wt.Path
  Write-Host 'Obsidian이 켜져 있어 자동으로 열 수 없습니다. 경로를 클립보드에 복사했습니다.'
  Write-Host '  Obsidian 왼쪽 아래 보관함 전환기 > "Open folder as vault"(폴더를 보관함으로 열기) > 경로 붙여넣기.'
  Write-Host '  (또는 Obsidian을 완전히 껐다 켜면 보관함 목록에 보입니다.)'
} else {
  Start-Process ('obsidian://open?path=' + [uri]::EscapeDataString($wt.Path))
}
