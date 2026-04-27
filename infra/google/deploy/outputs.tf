output "frontend_url" {
  description = "Public URL of the frontend"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "gateway_url" {
  description = "Public URL of the API gateway"
  value       = google_cloud_run_v2_service.gateway.uri
}
