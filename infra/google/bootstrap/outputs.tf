output "ci_sa_email" {
  description = "CI/CD service account email"
  value       = google_service_account.ci_sa.email
}

output "github_secrets_pushed" {
  description = "List of GitHub Actions secrets that were created"
  value       = keys(github_actions_secret.secrets)
}
