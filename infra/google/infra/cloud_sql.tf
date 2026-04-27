resource "google_sql_database_instance" "postgres" {
  name             = "${local.name_prefix}-postgres"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier    = var.db_tier
    edition = "ENTERPRISE"

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id

      enable_private_path_for_google_cloud_services = true
    }

    backup_configuration {
      enabled = false
    }
  }

  deletion_protection = false

  depends_on = [google_service_networking_connection.private_vpc]
}

resource "google_sql_user" "ctse" {
  name     = "ctse"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

resource "google_sql_database" "authdb" {
  name     = "authdb"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_database" "customer_db" {
  name     = "customer_db"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_database" "orderdb" {
  name     = "orderdb"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_database" "paymentdb" {
  name     = "paymentdb"
  instance = google_sql_database_instance.postgres.name
}
