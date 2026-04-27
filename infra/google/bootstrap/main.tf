terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }

  backend "gcs" {
    prefix = "terraform/bootstrap"
    # bucket passed at init time:
    #   terraform init -backend-config="bucket=<YOUR_BUCKET>"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "github" {
  owner = var.github_owner
  token = var.github_token
}

locals {
  name_prefix = "laundriq"
}
