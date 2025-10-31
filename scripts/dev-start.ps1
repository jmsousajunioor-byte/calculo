param(
    [string]$Bind = "0.0.0.0",
    [int]$Port = 8080,
    [string]$DocRoot = "public",
    [string]$PhpPath = "C:\\Users\\Junior\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe"
)

$ErrorActionPreference = 'Stop'

Write-Host "Starting dev server on ${Bind}:$Port (docroot: $DocRoot)" -ForegroundColor Cyan

# Ensure docroot exists
if (-not (Test-Path $DocRoot)) {
  throw "DocRoot '$DocRoot' not found. Run from the project root."
}

# Kill previous php dev servers on same port
Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { $pid = $_.OwningProcess; try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {} }

# Open firewall for the chosen port
try {
  $ruleName = "PHP_Dev_$Port"
  $existing = netsh advfirewall firewall show rule name=$ruleName | Out-String
  if ($existing -notmatch 'Enabled:.*Yes') {
    Write-Host "Adding firewall rule $ruleName" -ForegroundColor Yellow
    netsh advfirewall firewall add rule name=$ruleName dir=in action=allow protocol=TCP localport=$Port profile=private,public | Out-Null
  }
} catch { Write-Warning $_ }

# Enable debug
$env:APP_DEBUG = '1'

# Start server
& $PhpPath -S "$Bind`:$Port" -t $DocRoot
