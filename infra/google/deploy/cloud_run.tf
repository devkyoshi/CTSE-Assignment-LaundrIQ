# ── Shared locals ─────────────────────────────────────────────────────────────

locals {
  # connectTimeout=10 — fail fast (seconds) if DB is unreachable instead of hanging
  db_base   = "jdbc:postgresql://${data.google_sql_database_instance.postgres.private_ip_address}:5432"
  db_opts   = "?sslmode=disable&connectTimeout=10&socketTimeout=30"
  db_user   = "ctse"
  run_sa    = data.google_service_account.cloud_run_sa.email
  connector = data.google_vpc_access_connector.connector.id
  s         = data.google_secret_manager_secret.secrets
}

# ── Auth Service ──────────────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "auth_service" {
  name     = "auth-service"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  deletion_protection = false

  template {
    service_account = local.run_sa

    vpc_access {
      connector = local.connector
      egress    = "PRIVATE_RANGES_ONLY"
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      image = "${local.image_base}/auth-service:${var.image_tag}"

      ports {
        container_port = 8084
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      startup_probe {
        initial_delay_seconds = 10
        period_seconds        = 10
        failure_threshold     = 18
        tcp_socket {
          port = 8084
        }
      }

      env {
        name  = "SPRING_PROFILES_ACTIVE"
        value = "default"
      }
      env {
        name  = "SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE"
        value = "2"
      }
      env {
        name  = "SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE"
        value = "0"
      }
      env {
        name  = "DB_URL"
        value = "${local.db_base}/authdb${local.db_opts}"
      }
      env {
        name  = "DB_USERNAME"
        value = local.db_user
      }
      env {
        name  = "ADMIN_USERNAME"
        value = var.admin_username
      }
      env {
        name  = "ADMIN_EMAIL"
        value = var.admin_email
      }
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = local.s["db-password"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = local.s["jwt-secret"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "ADMIN_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = local.s["admin-password"].secret_id
            version = "latest"
          }
        }
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "auth_service_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.auth_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Customer Service — HTTP (used by gateway) ─────────────────────────────────

resource "google_cloud_run_v2_service" "customer_service" {
  name     = "customer-service"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  deletion_protection = false

  template {
    service_account = local.run_sa

    vpc_access {
      connector = local.connector
      egress    = "PRIVATE_RANGES_ONLY"
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      image = "${local.image_base}/customer-service:${var.image_tag}"

      ports {
        container_port = 8086
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      startup_probe {
        initial_delay_seconds = 10
        period_seconds        = 10
        failure_threshold     = 18
        tcp_socket {
          port = 8086
        }
      }

      env {
        name  = "SPRING_PROFILES_ACTIVE"
        value = "default"
      }
      env {
        name  = "SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE"
        value = "2"
      }
      env {
        name  = "SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE"
        value = "0"
      }
      env {
        name  = "DB_URL"
        value = "${local.db_base}/customer_db${local.db_opts}"
      }
      env {
        name  = "DB_USERNAME"
        value = local.db_user
      }
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = local.s["db-password"].secret_id
            version = "latest"
          }
        }
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "customer_service_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.customer_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Customer Service — gRPC (used by order-service inter-service calls) ────────
# Cloud Run exposes one port per service. This second deployment of the same
# image declares port 9096 with h2c so order-service gRPC stubs can reach it.

resource "google_cloud_run_v2_service" "customer_service_grpc" {
  name     = "customer-service-grpc"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  deletion_protection = false

  template {
    service_account = local.run_sa

    vpc_access {
      connector = local.connector
      egress    = "PRIVATE_RANGES_ONLY"
    }

    scaling {
      # Keep one instance warm so order-service can always connect to gRPC on startup
      min_instance_count = 1
      max_instance_count = 3
    }

    containers {
      image = "${local.image_base}/customer-service:${var.image_tag}"

      # "h2c" tells Cloud Run to use HTTP/2 cleartext — required for gRPC
      ports {
        name           = "h2c"
        container_port = 9096
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      startup_probe {
        initial_delay_seconds = 10
        period_seconds        = 10
        failure_threshold     = 18
        tcp_socket {
          port = 9096
        }
      }

      env {
        name  = "SPRING_PROFILES_ACTIVE"
        value = "default"
      }
      env {
        name  = "SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE"
        value = "2"
      }
      env {
        name  = "SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE"
        value = "0"
      }
      env {
        name  = "DB_URL"
        value = "${local.db_base}/customer_db${local.db_opts}"
      }
      env {
        name  = "DB_USERNAME"
        value = local.db_user
      }
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = local.s["db-password"].secret_id
            version = "latest"
          }
        }
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "customer_service_grpc_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.customer_service_grpc.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Order Service ─────────────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "order_service" {
  name     = "order-service"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  deletion_protection = false

  template {
    service_account = local.run_sa

    vpc_access {
      connector = local.connector
      egress    = "PRIVATE_RANGES_ONLY"
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      image = "${local.image_base}/order-service:${var.image_tag}"

      ports {
        container_port = 8082
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      startup_probe {
        initial_delay_seconds = 10
        period_seconds        = 10
        failure_threshold     = 18
        tcp_socket {
          port = 8082
        }
      }

      env {
        name  = "SPRING_PROFILES_ACTIVE"
        value = "default"
      }
      env {
        name  = "SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE"
        value = "2"
      }
      env {
        name  = "SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE"
        value = "0"
      }
      env {
        name  = "DB_URL"
        value = "${local.db_base}/orderdb${local.db_opts}"
      }
      env {
        name  = "DB_USERNAME"
        value = local.db_user
      }
      env {
        name  = "CUSTOMER_SERVICE_GRPC_HOST"
        value = trimprefix(google_cloud_run_v2_service.customer_service_grpc.uri, "https://")
      }
      env {
        name  = "CUSTOMER_SERVICE_GRPC_PORT"
        value = "443"
      }
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = local.s["db-password"].secret_id
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [google_cloud_run_v2_service.customer_service_grpc]
}

resource "google_cloud_run_v2_service_iam_member" "order_service_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.order_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Payment Service ───────────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "payment_service" {
  name     = "payment-service"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  deletion_protection = false

  template {
    service_account = local.run_sa

    vpc_access {
      connector = local.connector
      egress    = "PRIVATE_RANGES_ONLY"
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      image = "${local.image_base}/payment-service:${var.image_tag}"

      ports {
        container_port = 8083
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      startup_probe {
        initial_delay_seconds = 10
        period_seconds        = 10
        failure_threshold     = 18
        tcp_socket {
          port = 8083
        }
      }

      env {
        name  = "SPRING_PROFILES_ACTIVE"
        value = "default"
      }
      env {
        name  = "SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE"
        value = "2"
      }
      env {
        name  = "SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE"
        value = "0"
      }
      env {
        name  = "DB_URL"
        value = "${local.db_base}/paymentdb${local.db_opts}"
      }
      env {
        name  = "DB_USERNAME"
        value = local.db_user
      }
      env {
        name  = "ORDER_SERVICE_URL"
        value = google_cloud_run_v2_service.order_service.uri
      }
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = local.s["db-password"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "STRIPE_SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = local.s["stripe-secret-key"].secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "STRIPE_WEBHOOK_SECRET"
        value_source {
          secret_key_ref {
            secret  = local.s["stripe-webhook-secret"].secret_id
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [google_cloud_run_v2_service.order_service]
}

resource "google_cloud_run_v2_service_iam_member" "payment_service_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.payment_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── API Gateway (public) ──────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "gateway" {
  name     = "gateway"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  deletion_protection = false

  template {
    service_account = local.run_sa

    # Route ALL egress through VPC so that requests to backend Cloud Run services
    # (which have INGRESS_TRAFFIC_INTERNAL_ONLY) are treated as internal traffic.
    # The gateway makes no external internet calls, so no Cloud NAT is required.
    vpc_access {
      connector = local.connector
      egress    = "ALL_TRAFFIC"
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = "${local.image_base}/gateway:${var.image_tag}"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      startup_probe {
        initial_delay_seconds = 10
        period_seconds        = 10
        failure_threshold     = 18
        tcp_socket {
          port = 8080
        }
      }

      env {
        name  = "AUTH_SERVICE_URL"
        value = google_cloud_run_v2_service.auth_service.uri
      }
      env {
        name  = "CUSTOMER_SERVICE_URL"
        value = google_cloud_run_v2_service.customer_service.uri
      }
      env {
        name  = "ORDER_SERVICE_URL"
        value = google_cloud_run_v2_service.order_service.uri
      }
      env {
        name  = "PAYMENT_SERVICE_URL"
        value = google_cloud_run_v2_service.payment_service.uri
      }
      env {
        name  = "FRONTEND_ORIGIN"
        value = ""
      }
    }
  }

  depends_on = [
    google_cloud_run_v2_service.auth_service,
    google_cloud_run_v2_service.customer_service,
    google_cloud_run_v2_service.order_service,
    google_cloud_run_v2_service.payment_service,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "gateway_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.gateway.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Frontend (public) ─────────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "frontend" {
  name     = "frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  deletion_protection = false

  template {
    service_account = local.run_sa

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = "${local.image_base}/frontend:${var.image_tag}"

      ports {
        container_port = 80
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      # nginx substitutes this at container startup via envsubst (nginx.gcp.conf)
      env {
        name  = "GATEWAY_URL"
        value = google_cloud_run_v2_service.gateway.uri
      }
    }
  }

  depends_on = [google_cloud_run_v2_service.gateway]
}

resource "google_cloud_run_v2_service_iam_member" "frontend_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
