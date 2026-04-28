terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  backend "gcs" {
    prefix = "terraform/deploy"
    # bucket passed at init time:
    #   terraform init -backend-config="bucket=<YOUR_BUCKET>"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_project" "current" {
  project_id = var.project_id
}

locals {
  name_prefix = "laundriq"
  ar_hostname = "${var.region}-docker.pkg.dev"
  image_base  = "${local.ar_hostname}/${var.project_id}/${var.ar_repo_name}"
}

# ── Data sources — read state created by infra/ ───────────────────────────────

data "google_sql_database_instance" "postgres" {
  name = "${local.name_prefix}-postgres"
}

data "google_vpc_access_connector" "connector" {
  name   = "${local.name_prefix}-connector"
  region = var.region
}

data "google_service_account" "cloud_run_sa" {
  account_id = "${local.name_prefix}-run-sa"
}

data "google_secret_manager_secret" "secrets" {
  for_each  = toset(["db-password", "jwt-secret", "admin-password", "stripe-secret-key", "stripe-webhook-secret"])
  secret_id = each.key
}
