resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = var.ar_repo_name
  format        = "DOCKER"
  description   = "LaundrIQ microservice images"

  depends_on = [google_project_service.apis]
}
