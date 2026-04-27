output "frontend_fqdn" {
  description = "Public URL of the frontend"
  value       = "https://${module.frontend.fqdn}"
}

output "acr_login_server" {
  description = "ACR login server"
  value       = module.acr.login_server
}

output "postgres_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = module.postgres.fqdn
}
