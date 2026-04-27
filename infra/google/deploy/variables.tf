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

variable "image_tag" {
  description = "Docker image tag — set to the git commit SHA by CI"
  type        = string
}

variable "admin_username" {
  description = "Seed admin username (must match the value used in infra/)"
  type        = string
  default     = "admin"
}

variable "admin_email" {
  description = "Seed admin email (must match the value used in infra/)"
  type        = string
  default     = "admin@mail.com"
}
