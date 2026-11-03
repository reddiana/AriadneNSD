# Shows a Windows toast for a Claude Code hook (Notification / Stop).
# Called from .claude/settings.local.json. Runs in Windows PowerShell 5.1 (powershell.exe),
# because PowerShell 7 cannot load the WinRT notification types.
param([string]$Event = 'Notification')

$title = 'AriadneNSD · Claude'
$body = if ($Event -eq 'Stop') { '답했습니다. 확인해 주세요.' } else { 'Claude가 기다리고 있습니다.' }

# The hook payload arrives as JSON on stdin; Notification carries a message.
try {
  [Console]::InputEncoding = [System.Text.Encoding]::UTF8
  $raw = [Console]::In.ReadToEnd()
  if ($raw) {
    $data = $raw | ConvertFrom-Json
    if ($Event -ne 'Stop' -and $data.message) { $body = [string]$data.message }
  }
} catch {}

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$esc = { param($s) [System.Security.SecurityElement]::Escape($s) }
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml("<toast><visual><binding template='ToastGeneric'><text>$(& $esc $title)</text><text>$(& $esc $body)</text></binding></visual></toast>")

# PowerShell's own app id, so Windows shows the toast without registering a new app.
$appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show(
  [Windows.UI.Notifications.ToastNotification]::new($xml))
