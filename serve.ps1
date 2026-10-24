$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8000/")

try {
  $listener.Start()
} catch {
  Write-Error "Could not start the local server on port 8000. Close any other server using that port and try again. $($_.Exception.Message)"
  exit 1
}

Write-Host "Form is running at http://127.0.0.1:8000/"
Write-Host "Press Ctrl+C to stop the server."

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $relativePath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($relativePath)) {
      $relativePath = "index.html"
    }

    $filePath = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $relativePath))
    $rootPrefix = $root.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $filePath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
      $context.Response.StatusCode = 403
      $context.Response.Close()
      continue
    }

    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
      $context.Response.StatusCode = 404
      $context.Response.Close()
      continue
    }

    $extension = [IO.Path]::GetExtension($filePath).ToLowerInvariant()
    switch ($extension) {
      ".html" { $context.Response.ContentType = "text/html; charset=utf-8" }
      ".css" { $context.Response.ContentType = "text/css; charset=utf-8" }
      ".js" { $context.Response.ContentType = "text/javascript; charset=utf-8" }
      ".json" { $context.Response.ContentType = "application/json; charset=utf-8" }
      ".svg" { $context.Response.ContentType = "image/svg+xml" }
      default { $context.Response.ContentType = "application/octet-stream" }
    }

    $context.Response.Headers["Cache-Control"] = "no-cache"
    $bytes = [IO.File]::ReadAllBytes($filePath)
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
