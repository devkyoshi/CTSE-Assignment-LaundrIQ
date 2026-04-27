locals {
  secret_values = {
    db-password           = var.db_password
    jwt-secret            = var.jwt_secret
    admin-password        = var.admin_password
    stripe-secret-key     = var.stripe_secret_key
    stripe-webhook-secret = var.stripe_webhook_secret
  }
}

resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secret_values
  secret_id = each.key

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "versions" {
  for_each    = local.secret_values
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value
}
