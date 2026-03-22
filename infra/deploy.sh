#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# CTSE Deploy Script
# Runs Terraform to create/update Azure resources and Container Apps.
# Uses your local 'az login' session for authentication.
#
# INSTRUCTIONS: Fill in the secrets below before running.
#
# Usage:
#   bash deploy.sh              # deploy with 'latest' image tag
#   bash deploy.sh abc123def    # deploy with specific image tag (e.g., git SHA)
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

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

info()  { printf "${GREEN}[INFO]${NC} %s\n" "$1"; }
error() { printf "${RED}[ERROR]${NC} %s\n" "$1"; exit 1; }

# ──────────────────────────────────────────────
# Check prerequisites
# ──────────────────────────────────────────────
command -v az >/dev/null 2>&1 || error "Azure CLI (az) is not installed."
command -v terraform >/dev/null 2>&1 || error "Terraform is not installed. Install from https://developer.hashicorp.com/terraform/install"
az account show >/dev/null 2>&1 || error "Not logged into Azure. Run 'az login' first."

# ──────────────────────────────────────────────
# Validate required variables
# ──────────────────────────────────────────────
[ -z "$POSTGRES_ADMIN_PASSWORD" ] && error "POSTGRES_ADMIN_PASSWORD is not set. Fill it in at the top of this script."
[ -z "$JWT_SECRET" ]              && error "JWT_SECRET is not set. Fill it in at the top of this script."
[ -z "$STRIPE_SECRET_KEY" ]       && error "STRIPE_SECRET_KEY is not set. Fill it in at the top of this script."
[ -z "$STRIPE_PUBLISHABLE_KEY" ]  && error "STRIPE_PUBLISHABLE_KEY is not set. Fill it in at the top of this script."
[ -z "$ADMIN_PASSWORD" ]          && error "ADMIN_PASSWORD is not set. Fill it in at the top of this script."

IMAGE_TAG="${1:-latest}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ──────────────────────────────────────────────
# Export Terraform variables
# ──────────────────────────────────────────────
export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
export ARM_TENANT_ID=$(az account show --query tenantId -o tsv)
export TF_VAR_postgres_admin_password="$POSTGRES_ADMIN_PASSWORD"
export TF_VAR_jwt_secret="$JWT_SECRET"
export TF_VAR_stripe_secret_key="$STRIPE_SECRET_KEY"
export TF_VAR_stripe_webhook_secret="$STRIPE_WEBHOOK_SECRET"
export TF_VAR_stripe_publishable_key="$STRIPE_PUBLISHABLE_KEY"
export TF_VAR_admin_password="$ADMIN_PASSWORD"

info "Using subscription: $ARM_SUBSCRIPTION_ID"
info "Image tag: $IMAGE_TAG"

# ──────────────────────────────────────────────
# Terraform
# ──────────────────────────────────────────────
info "Initializing Terraform..."
terraform init

info "Planning..."
terraform plan \
  -var="subscription_id=$ARM_SUBSCRIPTION_ID" \
  -var="image_tag=$IMAGE_TAG" \
  -out=tfplan

info "Applying..."
terraform apply -auto-approve tfplan

rm -f tfplan

echo ""
info "Deploy complete!"
terraform output
