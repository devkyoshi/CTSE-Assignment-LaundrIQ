variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "ar_repo_name" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "laundriq"
}

variable "db_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_password" {
  description = "Password for the Cloud SQL 'ctse' user"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Base64-encoded JWT signing secret"
  type        = string
  sensitive   = true
}

variable "admin_username" {
  description = "Seed admin username for auth-service"
  type        = string
  default     = "admin"
}

variable "admin_email" {
  description = "Seed admin email for auth-service"
  type        = string
  default     = "admin@mail.com"
}

variable "admin_password" {
  description = "Seed admin password for auth-service"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
}
