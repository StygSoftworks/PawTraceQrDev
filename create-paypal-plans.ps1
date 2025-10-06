param(
  [ValidateSet('sandbox','live')]
  [string]$Environment = 'sandbox',

  [Parameter(Mandatory = $true)]
  [string]$ClientId,

  [Parameter(Mandatory = $true)]
  [string]$ClientSecret,

  # Currency & pricing
  [string]$Currency = 'USD',

  [decimal]$BaseMonthly  = 3.00,
  [decimal]$BaseYearly   = 30.00,
  [decimal]$AddonMonthly = 1.50,
  [decimal]$AddonYearly  = 18.00,

  # Optional tax (percentage as string or number; e.g. "8.875" or 8.875)
  [string]$TaxPercent = $null,

  # Output file for IDs
  [string]$OutputJson = ".\paypal_plans_output.json"
)

# ---------------- Helpers ----------------
function Get-PayPalBaseUrl {
  param([string]$Env)
  if ($Env -eq 'live') { return 'https://api-m.paypal.com' }
  else { return 'https://api-m.sandbox.paypal.com' }
}

function Get-AccessToken {
  param(
    [string]$BaseUrl,
    [string]$ClientId,
    [string]$ClientSecret
  )
  $pair = "{0}:{1}" -f $ClientId, $ClientSecret
  $basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
  $headers = @{ Authorization = "Basic $basic" }

  $body = 'grant_type=client_credentials'
  $tokenResp = Invoke-RestMethod -Method Post -Uri "$BaseUrl/v1/oauth2/token" `
    -Headers $headers -Body $body -ContentType 'application/x-www-form-urlencoded'

  if (-not $tokenResp.access_token) { throw "Failed to get access token." }
  return $tokenResp.access_token
}

function Invoke-PayPal {
  param(
    [string]$Method,
    [string]$Url,
    [string]$AccessToken,
    $Body = $null
  )
  $headers = @{
    Authorization = "Bearer $AccessToken"
    'Content-Type' = 'application/json'
  }

  if ($Body -ne $null) {
    $json = ($Body | ConvertTo-Json -Depth 10)
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -Body $json
  } else {
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers
  }
}

function Activate-Plan {
  param([string]$BaseUrl,[string]$AccessToken,[string]$PlanId)
  try {
    Invoke-PayPal -Method Post -Url "$BaseUrl/v1/billing/plans/$PlanId/activate" -AccessToken $AccessToken | Out-Null
  } catch {
    throw "Failed to activate plan $PlanId. $_"
  }
}

# ---------------- Start ----------------
$baseUrl = Get-PayPalBaseUrl -Env $Environment
Write-Host "Environment: $Environment ($baseUrl)" -ForegroundColor Cyan

$accessToken = Get-AccessToken -BaseUrl $baseUrl -ClientId $ClientId -ClientSecret $ClientSecret
Write-Host "Access token acquired." -ForegroundColor Green

# ---------------- Create Products ----------------
$productA = @{
  name        = "PawTrace Base"
  description = "Base subscription for PawTrace (includes up to 3 pets)"
  type        = "SERVICE"
  category    = "SOFTWARE"  # closest reasonable category
}
$productB = @{
  name        = "Extra Pets Add-on"
  description = "Adds additional pet slots to your PawTrace account"
  type        = "SERVICE"
  category    = "SOFTWARE"
}

Write-Host "Creating product A (PawTrace Base)..." -ForegroundColor Yellow
$prodAResp = Invoke-PayPal -Method Post -Url "$baseUrl/v1/catalogs/products" -AccessToken $accessToken -Body $productA
if (-not $prodAResp.id) { throw "Product A creation failed." }
Write-Host "Product A ID: $($prodAResp.id)" -ForegroundColor Green

Write-Host "Creating product B (Extra Pets Add-on)..." -ForegroundColor Yellow
$prodBResp = Invoke-PayPal -Method Post -Url "$baseUrl/v1/catalogs/products" -AccessToken $accessToken -Body $productB
if (-not $prodBResp.id) { throw "Product B creation failed." }
Write-Host "Product B ID: $($prodBResp.id)" -ForegroundColor Green

# ---------------- Build plan bodies ----------------
function New-PlanBody {
  param(
    [string]$ProductId,
    [string]$Name,
    [string]$IntervalUnit,  # MONTH or YEAR
    [int]$IntervalCount,
    [decimal]$Price,
    [string]$Currency,
    [string]$TaxPercent
  )

  $plan = @{
    product_id   = $ProductId
    name         = $Name
    status       = "CREATED"
    billing_cycles = @(
      @{
        frequency = @{
          interval_unit  = $IntervalUnit
          interval_count = $IntervalCount
        }
        tenure_type   = "REGULAR"
        sequence      = 1
        total_cycles  = 0   # 0 = infinite
        pricing_scheme = @{
          version       = 1
          fixed_price   = @{
            value         = ("{0:N2}" -f $Price)
            currency_code = $Currency
          }
        }
      }
    )
    payment_preferences = @{
      auto_bill_outstanding = $true
      setup_fee = @{
        value = "0.00"
        currency_code = $Currency
      }
      setup_fee_failure_action = "CONTINUE"
      payment_failure_threshold = 1
    }
  }

  if ($TaxPercent) {
    $plan.taxes = @{
      percentage = "$TaxPercent"  # string per API
      inclusive  = $false         # set true if your price includes tax
    }
  }

  return $plan
}

# ---------------- Create Plans ----------------
$plans = @{}

Write-Host "Creating plans..." -ForegroundColor Yellow

# A1: Base Monthly
$A1 = New-PlanBody -ProductId $prodAResp.id -Name "PawTrace Base (Monthly)" `
  -IntervalUnit "MONTH" -IntervalCount 1 -Price $BaseMonthly -Currency $Currency -TaxPercent $TaxPercent
$A1Resp = Invoke-PayPal -Method Post -Url "$baseUrl/v1/billing/plans" -AccessToken $accessToken -Body $A1
$plans.A1 = $A1Resp.id
Write-Host "A1 plan id: $($A1Resp.id)" -ForegroundColor Green

# A2: Base Yearly
$A2 = New-PlanBody -ProductId $prodAResp.id -Name "PawTrace Base (Yearly)" `
  -IntervalUnit "YEAR" -IntervalCount 1 -Price $BaseYearly -Currency $Currency -TaxPercent $TaxPercent
$A2Resp = Invoke-PayPal -Method Post -Url "$baseUrl/v1/billing/plans" -AccessToken $accessToken -Body $A2
$plans.A2 = $A2Resp.id
Write-Host "A2 plan id: $($A2Resp.id)" -ForegroundColor Green

# B1: Add-on Monthly
$B1 = New-PlanBody -ProductId $prodBResp.id -Name "Extra Pets Add-on (Monthly)" `
  -IntervalUnit "MONTH" -IntervalCount 1 -Price $AddonMonthly -Currency $Currency -TaxPercent $TaxPercent
$B1Resp = Invoke-PayPal -Method Post -Url "$baseUrl/v1/billing/plans" -AccessToken $accessToken -Body $B1
$plans.B1 = $B1Resp.id
Write-Host "B1 plan id: $($B1Resp.id)" -ForegroundColor Green

# B2: Add-on Yearly
$B2 = New-PlanBody -ProductId $prodBResp.id -Name "Extra Pets Add-on (Yearly)" `
  -IntervalUnit "YEAR" -IntervalCount 1 -Price $AddonYearly -Currency $Currency -TaxPercent $TaxPercent
$B2Resp = Invoke-PayPal -Method Post -Url "$baseUrl/v1/billing/plans" -AccessToken $accessToken -Body $B2
$plans.B2 = $B2Resp.id
Write-Host "B2 plan id: $($B2Resp.id)" -ForegroundColor Green

# ---------------- Activate Plans ----------------
Write-Host "Activating plans..." -ForegroundColor Yellow
Activate-Plan -BaseUrl $baseUrl -AccessToken $accessToken -PlanId $plans.A1
Activate-Plan -BaseUrl $baseUrl -AccessToken $accessToken -PlanId $plans.A2
Activate-Plan -BaseUrl $baseUrl -AccessToken $accessToken -PlanId $plans.B1
Activate-Plan -BaseUrl $baseUrl -AccessToken $accessToken -PlanId $plans.B2
Write-Host "All plans activated." -ForegroundColor Green

# ---------------- Output summary ----------------
$result = [ordered]@{
  environment = $Environment
  currency    = $Currency
  products    = @{
    PawTraceBase       = $prodAResp.id
    ExtraPetsAddOn     = $prodBResp.id
  }
  plans       = $plans
  tax_percent = $TaxPercent
}

$result | ConvertTo-Json -Depth 10 | Set-Content -Path $OutputJson -Encoding UTF8
Write-Host ""
Write-Host "Created products & plans. IDs saved to: $OutputJson" -ForegroundColor Cyan
Write-Host ""
Write-Host "Use these in your frontend:" -ForegroundColor Yellow
Write-Host ("- Base Monthly plan_id: {0}" -f $plans.A1)
Write-Host ("- Base Yearly  plan_id: {0}" -f $plans.A2)
Write-Host ("- Add-on Monthly plan_id: {0}" -f $plans.B1)
Write-Host ("- Add-on Yearly  plan_id: {0}" -f $plans.B2)
