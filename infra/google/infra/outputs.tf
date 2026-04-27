output "artifact_registry_repo" {
  description = "Docker image prefix for all services"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.ar_repo_name}"
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name (project:region:instance)"
  value       = google_sql_database_instance.postgres.connection_name
}

output "cloud_run_sa_email" {
  description = "Runtime service account email (attached to every Cloud Run service)"
  value       = google_service_account.cloud_run_sa.email
}
