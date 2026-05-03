$ErrorActionPreference = 'Stop'

function Get-JsonFile {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Path
  )

  $raw = Get-Content -LiteralPath $Path -Raw
  return $raw | ConvertFrom-Json
}

function Test-SchemaVersion {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Path,
    [Parameter(Mandatory = $true)]
    $Document
  )

  if (-not $Document.PSObject.Properties.Name.Contains('properties')) {
    throw "Schema missing properties block: $Path"
  }

  if (-not $Document.properties.PSObject.Properties.Name.Contains('schemaVersion')) {
    throw "Schema missing schemaVersion property: $Path"
  }

  $expectedVersion = if ($Path -like '*qr-payload-config.v1.schema.json') { 'qurl.qr-payload-config.v1' }
    elseif ($Path -like '*qr-design-config.v1.schema.json') { 'qurl.qr-design-config.v1' }
    elseif ($Path -like '*qr-export-config.v1.schema.json') { 'qurl.qr-export-config.v1' }
    elseif ($Path -like '*qr-project-config.v1.schema.json') { 'qurl.qr-project-config.v1' }
    elseif ($Path -like '*qr-type-registry.v1.schema.json') { 'qurl.qr-type-registry.v1' }
    else { $null }

  if ($null -ne $expectedVersion) {
    $actualVersion = $Document.properties.schemaVersion.const
    if ($actualVersion -ne $expectedVersion) {
      throw "Schema version mismatch in $Path. Expected $expectedVersion, found $actualVersion"
    }
  }
}

function Get-Refs {
  param(
    [Parameter(Mandatory = $true)]
    $Node,
    [string] $PathPrefix = ''
  )

  $refs = @()

  if ($null -eq $Node) {
    return $refs
  }

  if ($Node -is [System.Collections.IEnumerable] -and $Node -isnot [string]) {
    $index = 0
    foreach ($item in $Node) {
      $refs += Get-Refs -Node $item -PathPrefix "$PathPrefix[$index]"
      $index++
    }
  }
  elseif ($Node -is [System.Collections.IDictionary]) {
    foreach ($key in $Node.Keys) {
      $nextPrefix = if ($PathPrefix) { "$PathPrefix.$key" } else { $key }
      if ($key -eq '$ref') {
        $refs += [pscustomobject]@{
          path = $PathPrefix
          ref  = [string] $Node[$key]
        }
      }
      else {
        $refs += Get-Refs -Node $Node[$key] -PathPrefix $nextPrefix
      }
    }
  }
  elseif ($Node.PSObject -and $Node.PSObject.Properties.Count -gt 0) {
    foreach ($property in $Node.PSObject.Properties) {
      $nextPrefix = if ($PathPrefix) { "$PathPrefix.$($property.Name)" } else { $property.Name }
      if ($property.Name -eq '$ref') {
        $refs += [pscustomobject]@{
          path = $PathPrefix
          ref  = [string] $property.Value
        }
      }
      else {
        $refs += Get-Refs -Node $property.Value -PathPrefix $nextPrefix
      }
    }
  }

  return $refs
}

$root = Split-Path -Parent $PSScriptRoot
$schemaDir = Join-Path (Join-Path $root 'schemas') 'v1'
$openApiFile = Join-Path (Join-Path (Join-Path $root 'openapi') 'v1') 'qurl.openapi.v1.json'

$schemaFiles = Get-ChildItem -LiteralPath $schemaDir -Filter '*.schema.json' | Sort-Object Name
if (-not $schemaFiles) {
  throw "No schema files found in $schemaDir"
}

$ids = @{}
foreach ($file in $schemaFiles) {
  $doc = Get-JsonFile -Path $file.FullName

  if (-not $doc.PSObject.Properties.Name.Contains('$id')) {
    throw "Schema missing `$id: $($file.FullName)"
  }

  if ($ids.ContainsKey($doc.'$id')) {
    throw "Duplicate schema `$id found: $($doc.'$id')"
  }
  $ids[$doc.'$id'] = $file.FullName

  Test-SchemaVersion -Path $file.Name -Document $doc
}

$openApi = Get-JsonFile -Path $openApiFile

if ($openApi.openapi -ne '3.1.0') {
  throw "OpenAPI version must be 3.1.0"
}

if ($openApi.info.version -ne '1.0.0') {
  throw "OpenAPI info.version must be 1.0.0"
}

if ($openApi.servers[0].url -ne '/api/v1') {
  throw "OpenAPI server URL must be /api/v1"
}

$expectedComponents = @(
  'QrPayloadConfigV1',
  'QrDesignConfigV1',
  'QrExportConfigV1',
  'QrProjectConfigV1',
  'QrTypeRegistryV1',
  'ValidationIssueV1',
  'QrProjectValidationResponseV1',
  'QrPreviewResponseV1',
  'QrProjectRecordV1',
  'QrExportArtifactV1'
)

foreach ($name in $expectedComponents) {
  if (-not $openApi.components.schemas.PSObject.Properties.Name.Contains($name)) {
    throw "Missing OpenAPI component schema: $name"
  }
}

$canonicalComponentRefs = @{
  QrPayloadConfigV1  = '../../schemas/v1/qr-payload-config.v1.schema.json'
  QrDesignConfigV1   = '../../schemas/v1/qr-design-config.v1.schema.json'
  QrExportConfigV1   = '../../schemas/v1/qr-export-config.v1.schema.json'
  QrProjectConfigV1  = '../../schemas/v1/qr-project-config.v1.schema.json'
  QrTypeRegistryV1   = '../../schemas/v1/qr-type-registry.v1.schema.json'
}

foreach ($componentName in $canonicalComponentRefs.Keys) {
  $schema = $openApi.components.schemas.$componentName
  $expectedRef = $canonicalComponentRefs[$componentName]

  if ($schema.'$ref' -ne $expectedRef) {
    throw "OpenAPI component $componentName must reference canonical schema $expectedRef"
  }
}

$refs = Get-Refs -Node $openApi
foreach ($ref in $refs) {
  if ($ref.ref -like '#/components/schemas/*') {
    $target = $ref.ref.Substring('#/components/schemas/'.Length)
    if (-not $openApi.components.schemas.PSObject.Properties.Name.Contains($target)) {
      throw "Broken OpenAPI ref at $($ref.path): $($ref.ref)"
    }
  }
  elseif ($ref.ref -notlike '#*') {
    $baseDir = Split-Path -Parent $openApiFile
    $relativePath = ($ref.ref -split '#')[0]
    $targetPath = Join-Path $baseDir $relativePath

    if (-not (Test-Path -LiteralPath $targetPath)) {
      throw "Broken external OpenAPI ref at $($ref.path): $($ref.ref)"
    }
  }
}

Write-Host "Validated $($schemaFiles.Count) schema files and one OpenAPI contract."
