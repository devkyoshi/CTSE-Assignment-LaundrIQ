#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# CTSE Azure Bootstrap Script
# Run once to provision Azure resources and set GitHub secrets.
# Prerequisites: az CLI (logged in), gh CLI (authenticated)
#
# INSTRUCTIONS: Fill in the variables below before running.
#
# After this script completes:
#   1. Run 'bash deploy.sh' to create infrastructure via Terraform
#   2. Re-run this script to set ACR secrets for GitHub Actions
#   3. Push to 'main' — GitHub Actions builds & pushes images to ACR
#   4. Run 'bash deploy.sh <commit-sha>' to deploy the new images
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
ACR_NAME="ctseprodacr"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
  --auth-mode login \
  --output none

# ──────────────────────────────────────────────
# Fetch ACR credentials (if ACR exists from a prior deploy)
# ──────────────────────────────────────────────
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv 2>/dev/null || echo "")
ACR_USERNAME=""
ACR_PASSWORD=""

if [ -n "$ACR_LOGIN_SERVER" ]; then
  info "ACR found. Fetching admin credentials..."
  ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query username -o tsv)
  ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query "passwords[0].value" -o tsv)
else
  warn "ACR does not exist yet. Run 'bash deploy.sh' first, then re-run this script to set ACR secrets."
fi

# ──────────────────────────────────────────────
# Set GitHub Actions secrets
# ──────────────────────────────────────────────
info "Setting GitHub Actions secrets on '$GITHUB_REPO'..."

# Secrets needed by GitHub Actions (build & push only)
gh secret set STRIPE_PUBLISHABLE_KEY  --repo "$GITHUB_REPO" --body "$STRIPE_PUBLISHABLE_KEY"

if [ -n "$ACR_LOGIN_SERVER" ]; then
  gh secret set ACR_LOGIN_SERVER      --repo "$GITHUB_REPO" --body "$ACR_LOGIN_SERVER"
  gh secret set ACR_USERNAME          --repo "$GITHUB_REPO" --body "$ACR_USERNAME"
  gh secret set ACR_PASSWORD          --repo "$GITHUB_REPO" --body "$ACR_PASSWORD"
  info "ACR secrets set."
else
  warn "Skipping ACR secrets (ACR not yet created)."
fi

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
echo "  GitHub Secrets set on: $GITHUB_REPO"
echo ""
if [ -z "$ACR_LOGIN_SERVER" ]; then
  echo "  Next steps:"
  echo "    1. Run 'bash deploy.sh' to create all Azure resources"
  echo "    2. Re-run 'bash setup.sh' to set ACR secrets for GitHub Actions"
  echo "    3. Push to 'main' — images will build and push to ACR"
  echo "    4. Run 'bash deploy.sh <commit-sha>' to deploy new images"
else
  echo "  Next steps:"
  echo "    1. Push to 'main' — images will build and push to ACR"
  echo "    2. Run 'bash deploy.sh <commit-sha>' to deploy new images"
fi
echo ""
