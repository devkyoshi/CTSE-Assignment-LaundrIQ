# All GitHub Actions secrets and variables for the repository.
# Running this module once is enough — the CI workflow has no Terraform
# knowledge of GitHub; it just consumes the secrets set here.

locals {
  secrets = {
    GCP_PROJECT_ID         = var.project_id
    GCP_SA_KEY             = base64decode(google_service_account_key.ci_sa_key.private_key)
    GCP_TF_STATE_BUCKET    = var.tf_state_bucket
    DB_PASSWORD            = var.db_password
    JWT_SECRET             = var.jwt_secret
    ADMIN_PASSWORD         = var.admin_password
    STRIPE_SECRET_KEY      = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET  = var.stripe_webhook_secret
    STRIPE_PUBLISHABLE_KEY = var.stripe_publishable_key
  }
}

resource "github_actions_secret" "secrets" {
  for_each   = local.secrets
  repository = var.github_repo
  secret_name = each.key
  value       = each.value
}

# GCP_REGION as a plain variable so it's visible in the Actions UI
resource "github_actions_variable" "region" {
  repository    = var.github_repo
  variable_name = "GCP_REGION"
  value         = var.region
}
