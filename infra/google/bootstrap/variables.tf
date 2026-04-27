variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "tf_state_bucket" {
  description = "GCS bucket used for Terraform state across all modules (must already exist)"
  type        = string
}

# ── GitHub ────────────────────────────────────────────────────────────────────

variable "github_owner" {
  description = "GitHub username or organisation"
  type        = string
}

variable "github_repo" {
  description = "Repository name (without owner)"
  type        = string
  default     = "CTSE-Assignment-LaundrIQ"
}

variable "github_token" {
  description = "GitHub PAT with 'repo' scope"
  type        = string
  sensitive   = true
}

# ── Secrets to push ───────────────────────────────────────────────────────────

variable "db_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "admin_password" {
  type      = string
  sensitive = true
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
}

variable "stripe_publishable_key" {
  type      = string
  sensitive = true
}
