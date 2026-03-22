#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# CTSE Azure Bootstrap Script
# Run once before the first CI/CD pipeline run.
# Prerequisites: az CLI (logged in), gh CLI (authenticated)
#
# INSTRUCTIONS: Fill in the variables below before running.
# ──────────────────────────────────────────────

# ──────────────────────────────────────────────
# APP SECRETS — fill these in before running
# ──────────────────────────────────────────────
POSTGRES_ADMIN_PASSWORD=""
JWT_SECRET=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PUBLISHABLE_KEY=""
ADMIN_PASSWORD=""

# ──────────────────────────────────────────────
# AZURE CONFIG — adjust if needed
# ──────────────────────────────────────────────
RESOURCE_GROUP="ctse-prod"
LOCATION="southeastasia"
TF_STORAGE_ACCOUNT="ctsetfstate"
TF_CONTAINER="tfstate"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { printf "${GREEN}[INFO]${NC} %s\n" "$1"; }
warn()  { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }
error() { printf "${RED}[ERROR]${NC} %s\n" "$1"; exit 1; }

# ──────────────────────────────────────────────
# Check prerequisites
# ──────────────────────────────────────────────
command -v az >/dev/null 2>&1 || error "Azure CLI (az) is not installed. Install it from https://aka.ms/install-azure-cli"
command -v gh >/dev/null 2>&1 || error "GitHub CLI (gh) is not installed. Install it from https://cli.github.com"

az account show >/dev/null 2>&1 || error "Not logged into Azure. Run 'az login' first."
gh auth status >/dev/null 2>&1 || error "Not authenticated with GitHub. Run 'gh auth login' first."

# ──────────────────────────────────────────────
# Validate required variables
# ──────────────────────────────────────────────
[ -z "$POSTGRES_ADMIN_PASSWORD" ] && error "POSTGRES_ADMIN_PASSWORD is not set. Fill it in at the top of this script."
[ -z "$JWT_SECRET" ]              && error "JWT_SECRET is not set. Fill it in at the top of this script."
[ -z "$STRIPE_SECRET_KEY" ]       && error "STRIPE_SECRET_KEY is not set. Fill it in at the top of this script."
[ -z "$STRIPE_PUBLISHABLE_KEY" ]  && error "STRIPE_PUBLISHABLE_KEY is not set. Fill it in at the top of this script."
[ -z "$ADMIN_PASSWORD" ]          && error "ADMIN_PASSWORD is not set. Fill it in at the top of this script."

# ──────────────────────────────────────────────
# Detect subscription and GitHub repo
# ──────────────────────────────────────────────
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
info "Using Azure subscription: $SUBSCRIPTION_ID"

GITHUB_REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || echo "")
[ -z "$GITHUB_REPO" ] && error "Could not detect GitHub repo. Run this from the project root."
info "Using GitHub repo: $GITHUB_REPO"

# ──────────────────────────────────────────────
# Set Azure subscription
# ──────────────────────────────────────────────
echo ""
info "Setting Azure subscription to $SUBSCRIPTION_ID..."
az account set --subscription "$SUBSCRIPTION_ID"

# ──────────────────────────────────────────────
# Register required resource providers
# ──────────────────────────────────────────────
PROVIDERS=(
  "Microsoft.Storage"
  "Microsoft.App"
  "Microsoft.ContainerRegistry"
  "Microsoft.DBforPostgreSQL"
  "Microsoft.OperationalInsights"
  "Microsoft.OperationsManagement"
)

for provider in "${PROVIDERS[@]}"; do
  STATE=$(az provider show --namespace "$provider" --query registrationState -o tsv 2>/dev/null || echo "NotRegistered")
  if [ "$STATE" != "Registered" ]; then
    info "Registering provider $provider..."
    az provider register --namespace "$provider" --wait
  fi
done
info "All resource providers registered."

# ──────────────────────────────────────────────
# Create resource group
# ──────────────────────────────────────────────
info "Creating resource group '$RESOURCE_GROUP' in '$LOCATION'..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

# ──────────────────────────────────────────────
# Create Terraform state storage
# ──────────────────────────────────────────────
info "Creating storage account '$TF_STORAGE_ACCOUNT' for Terraform state..."
az storage account create \
  --name "$TF_STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --output none

info "Creating blob container '$TF_CONTAINER'..."
az storage container create \
  --name "$TF_CONTAINER" \
  --account-name "$TF_STORAGE_ACCOUNT" \
  --output none

# ──────────────────────────────────────────────
# Create service principal
# ──────────────────────────────────────────────
info "Creating service principal 'ctse-deploy'..."
# Create SP and extract fields using az CLI's built-in --query (works on Mac/Linux/Windows)
CLIENT_ID=$(az ad sp create-for-rbac \
  --name "ctse-deploy" \
  --role contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --query appId -o tsv)

# The SP was just created, so we can query its credentials
# Re-fetch tenant from the current account (tenant doesn't change)
TENANT_ID=$(az account show --query tenantId -o tsv)

# Reset credentials to get a fresh password
CLIENT_SECRET=$(az ad sp credential reset \
  --id "$CLIENT_ID" \
  --query password -o tsv)

# Build AZURE_CREDENTIALS JSON for azure/login action
AZURE_CREDENTIALS=$(cat <<EOF
{"clientId":"$CLIENT_ID","clientSecret":"$CLIENT_SECRET","subscriptionId":"$SUBSCRIPTION_ID","tenantId":"$TENANT_ID"}
EOF
)

# ──────────────────────────────────────────────
# Set GitHub Actions secrets
# ──────────────────────────────────────────────
info "Setting GitHub Actions secrets on '$GITHUB_REPO'..."

gh secret set AZURE_CREDENTIALS       --repo "$GITHUB_REPO" --body "$AZURE_CREDENTIALS"
gh secret set AZURE_CLIENT_ID         --repo "$GITHUB_REPO" --body "$CLIENT_ID"
gh secret set AZURE_CLIENT_SECRET     --repo "$GITHUB_REPO" --body "$CLIENT_SECRET"
gh secret set AZURE_TENANT_ID         --repo "$GITHUB_REPO" --body "$TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID   --repo "$GITHUB_REPO" --body "$SUBSCRIPTION_ID"
gh secret set AZURE_RESOURCE_GROUP    --repo "$GITHUB_REPO" --body "$RESOURCE_GROUP"
gh secret set POSTGRES_ADMIN_PASSWORD --repo "$GITHUB_REPO" --body "$POSTGRES_ADMIN_PASSWORD"
gh secret set JWT_SECRET              --repo "$GITHUB_REPO" --body "$JWT_SECRET"
gh secret set STRIPE_SECRET_KEY       --repo "$GITHUB_REPO" --body "$STRIPE_SECRET_KEY"
gh secret set STRIPE_WEBHOOK_SECRET   --repo "$GITHUB_REPO" --body "$STRIPE_WEBHOOK_SECRET"
gh secret set STRIPE_PUBLISHABLE_KEY  --repo "$GITHUB_REPO" --body "$STRIPE_PUBLISHABLE_KEY"
gh secret set ADMIN_PASSWORD          --repo "$GITHUB_REPO" --body "$ADMIN_PASSWORD"

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
info "Azure bootstrap complete!"
echo "════════════════════════════════════════════════"
echo ""
echo "  Resource Group:        $RESOURCE_GROUP"
echo "  Location:              $LOCATION"
echo "  TF State Storage:      $TF_STORAGE_ACCOUNT/$TF_CONTAINER"
echo "  Service Principal:     ctse-deploy (App ID: $CLIENT_ID)"
echo "  GitHub Secrets set on: $GITHUB_REPO"
echo ""
echo "  Next step: Push to 'main' branch to trigger the CI/CD pipeline."
echo ""
