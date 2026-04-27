# Runtime service account attached to every Cloud Run service.
# The CI/CD service account (created in bootstrap/) deploys with this SA.

resource "google_service_account" "cloud_run_sa" {
  account_id   = "${local.name_prefix}-run-sa"
  display_name = "LaundrIQ Cloud Run Runtime Service Account"
}

resource "google_project_iam_member" "run_sa_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/artifactregistry.reader",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant the SA access to each secret individually (belt-and-suspenders)
resource "google_secret_manager_secret_iam_member" "run_sa_secrets" {
  for_each  = google_secret_manager_secret.secrets
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}
