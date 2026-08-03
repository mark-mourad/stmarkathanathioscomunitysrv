# Push local supabase/migrations to the linked remote project.
# Requires in .env:
#   SUPABASE_ACCESS_TOKEN=sbp_...
#   SUPABASE_DB_PASSWORD=your_db_password

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root ".env"
if (-not (Test-Path $envFile)) {
  Write-Error ".env not found at $envFile"
}

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
    $name = $matches[1]
    $value = $matches[2].Trim()
    if ($value.Length -ge 2 -and $value[0] -eq '"' -and $value[-1] -eq '"') {
      $value = $value.Substring(1, $value.Length - 2)
    } else {
      $hashIndex = $value.IndexOf('#')
      if ($hashIndex -ge 0) { $value = $value.Substring(0, $hashIndex).TrimEnd() }
    }
    Set-Item -Path "Env:$name" -Value $value
  }
}

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Error "Missing SUPABASE_ACCESS_TOKEN in .env — create one at https://supabase.com/dashboard/account/tokens"
}
if (-not $env:SUPABASE_DB_PASSWORD) {
  Write-Error "Missing SUPABASE_DB_PASSWORD in .env — find it in Project Settings → Database"
}

$projectRef = $env:SUPABASE_PROJECT_ID
if (-not $projectRef) {
  $projectRef = $env:VITE_SUPABASE_PROJECT_ID
}
if (-not $projectRef) {
  Write-Error "Missing SUPABASE_PROJECT_ID in .env"
}

Write-Host "Logging in to Supabase CLI..."
npx supabase login --token $env:SUPABASE_ACCESS_TOKEN

Write-Host "Linking project $projectRef..."
npx supabase link --project-ref $projectRef --password $env:SUPABASE_DB_PASSWORD

Write-Host "Dry run..."
npx supabase db push --linked --dry-run

Write-Host "Pushing migrations..."
npx supabase db push --linked --yes

Write-Host "Done."
