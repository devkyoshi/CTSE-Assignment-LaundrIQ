#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# CTSE Deploy Script
# Runs Terraform to create/update Azure resources.
# Uses your local 'az login' session for authentication.
#
# Usage:
#   bash deploy.sh              # deploy with 'latest' image tag
#   bash deploy.sh abc123def    # deploy with specific image tag (e.g., git SHA)
# ──────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

info()  { printf "${GREEN}[INFO]${NC} %s\n" "$1"; }
error() { printf "${RED}[ERROR]${NC} %s\n" "$1"; exit 1; }

# Check prerequisites
command -v az >/dev/null 2>&1 || error "Azure CLI (az) is not installed."
command -v terraform >/dev/null 2>&1 || error "Terraform is not installed. Install from https://developer.hashicorp.com/terraform/install"
az account show >/dev/null 2>&1 || error "Not logged into Azure. Run 'az login' first."

IMAGE_TAG="${1:-latest}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Export ARM env vars from current az login session
export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
export ARM_TENANT_ID=$(az account show --query tenantId -o tsv)

info "Using subscription: $ARM_SUBSCRIPTION_ID"
info "Image tag: $IMAGE_TAG"

# Prompt for secrets if not set as env vars
[ -z "${TF_VAR_postgres_admin_password:-}" ] && read -rsp "PostgreSQL admin password: " TF_VAR_postgres_admin_password && echo && export TF_VAR_postgres_admin_password
[ -z "${TF_VAR_jwt_secret:-}" ]              && read -rsp "JWT secret: " TF_VAR_jwt_secret && echo && export TF_VAR_jwt_secret
[ -z "${TF_VAR_stripe_secret_key:-}" ]       && read -rsp "Stripe secret key: " TF_VAR_stripe_secret_key && echo && export TF_VAR_stripe_secret_key
[ -z "${TF_VAR_stripe_webhook_secret:-}" ]   && read -rsp "Stripe webhook secret: " TF_VAR_stripe_webhook_secret && echo && export TF_VAR_stripe_webhook_secret
[ -z "${TF_VAR_stripe_publishable_key:-}" ]  && read -rsp "Stripe publishable key: " TF_VAR_stripe_publishable_key && echo && export TF_VAR_stripe_publishable_key
[ -z "${TF_VAR_admin_password:-}" ]          && read -rsp "Admin password: " TF_VAR_admin_password && echo && export TF_VAR_admin_password

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
