# Dedicated service account used exclusively by GitHub Actions CI/CD.
# Its JSON key is exported as the GCP_SA_KEY GitHub Actions secret.

resource "google_service_account" "ci_sa" {
  account_id   = "${local.name_prefix}-ci-sa"
  display_name = "LaundrIQ CI/CD Service Account"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "ci_sa_roles" {
  for_each = toset([
    "roles/run.admin",
    "roles/artifactregistry.admin",
    "roles/storage.admin",                  # Terraform state in GCS
    "roles/secretmanager.admin",
    "roles/cloudsql.admin",
    "roles/compute.networkAdmin",
    "roles/vpcaccess.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/iam.serviceAccountUser",         # Assign runtime SA to Cloud Run
    "roles/serviceusage.serviceUsageAdmin",
    "roles/resourcemanager.projectIamAdmin",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.ci_sa.email}"
}

# The key is stored in Terraform state (GCS backend, encrypted at rest).
resource "google_service_account_key" "ci_sa_key" {
  service_account_id = google_service_account.ci_sa.name
}
