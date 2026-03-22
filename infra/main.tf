terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "ctse-prod"
    storage_account_name = "ctsetfstate"
    container_name       = "tfstate"
    key                  = "ctse-prod.tfstate"
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

# ──────────────────────────────────────────────
# Data source — existing resource group
# ──────────────────────────────────────────────
data "azurerm_resource_group" "this" {
  name = var.resource_group_name
}

# ──────────────────────────────────────────────
# Azure Container Registry
# ──────────────────────────────────────────────
module "acr" {
  source              = "./modules/container-registry"
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location
}

# ──────────────────────────────────────────────
# PostgreSQL Flexible Server
# ──────────────────────────────────────────────
module "postgres" {
  source              = "./modules/postgres"
  server_name         = var.postgres_server_name
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location
  admin_username      = var.postgres_admin_username
  admin_password      = var.postgres_admin_password
}

# ──────────────────────────────────────────────
# Container Apps Environment
# ──────────────────────────────────────────────
module "container_apps_env" {
  source              = "./modules/container-apps-env"
  name                = var.environment_name
  resource_group_name = data.azurerm_resource_group.this.name
  location            = data.azurerm_resource_group.this.location
}

# ──────────────────────────────────────────────
# Shared locals for Container App configs
# ──────────────────────────────────────────────
locals {
  common_app_args = {
    resource_group_name          = data.azurerm_resource_group.this.name
    container_app_environment_id = module.container_apps_env.environment_id
    acr_login_server             = module.acr.login_server
    acr_username                 = module.acr.admin_username
    acr_password                 = module.acr.admin_password
    image_tag                    = var.image_tag
  }

  db_connection_base = "jdbc:postgresql://${module.postgres.fqdn}:5432"

  db_secrets = [
    { name = "db-password", value = var.postgres_admin_password },
  ]

  db_secret_env = [
    { name = "DB_PASSWORD", secret_name = "db-password" },
  ]

  db_env = [
    { name = "DB_USERNAME", value = var.postgres_admin_username },
  ]
}

# ──────────────────────────────────────────────
# Auth Service
# ──────────────────────────────────────────────
module "auth_service" {
  source = "./modules/container-app"

  name       = "auth-service"
  image_name = "auth-service"

  target_port  = 8084
  is_external  = false
  min_replicas = 1
  max_replicas = 1

  secrets = concat(local.db_secrets, [
    { name = "jwt-secret", value = var.jwt_secret },
    { name = "admin-password", value = var.admin_password },
  ])

  env_vars = concat(local.db_env, [
    { name = "SPRING_PROFILES_ACTIVE", value = "default" },
    { name = "DB_URL", value = "${local.db_connection_base}/authdb?sslmode=require" },
    { name = "ADMIN_USERNAME", value = var.admin_username },
    { name = "ADMIN_EMAIL", value = var.admin_email },
  ])

  secret_env_vars = concat(local.db_secret_env, [
    { name = "JWT_SECRET", secret_name = "jwt-secret" },
    { name = "ADMIN_PASSWORD", secret_name = "admin-password" },
  ])

  depends_on = [module.postgres]

  resource_group_name          = local.common_app_args.resource_group_name
  container_app_environment_id = local.common_app_args.container_app_environment_id
  acr_login_server             = local.common_app_args.acr_login_server
  acr_username                 = local.common_app_args.acr_username
  acr_password                 = local.common_app_args.acr_password
  image_tag                    = local.common_app_args.image_tag
}

# ──────────────────────────────────────────────
# Customer Service
# ──────────────────────────────────────────────
module "customer_service" {
  source = "./modules/container-app"

  name       = "customer-service"
  image_name = "customer-service"

  target_port  = 8086
  is_external  = false
  min_replicas = 1
  max_replicas = 1

  secrets = local.db_secrets

  env_vars = concat(local.db_env, [
    { name = "SPRING_PROFILES_ACTIVE", value = "default" },
    { name = "DB_URL", value = "${local.db_connection_base}/customer_db?sslmode=require" },
  ])

  secret_env_vars = local.db_secret_env

  depends_on = [module.postgres]

  resource_group_name          = local.common_app_args.resource_group_name
  container_app_environment_id = local.common_app_args.container_app_environment_id
  acr_login_server             = local.common_app_args.acr_login_server
  acr_username                 = local.common_app_args.acr_username
  acr_password                 = local.common_app_args.acr_password
  image_tag                    = local.common_app_args.image_tag
}

# ──────────────────────────────────────────────
# Order Service
# ──────────────────────────────────────────────
module "order_service" {
  source = "./modules/container-app"

  name       = "order-service"
  image_name = "order-service"

  target_port  = 8082
  is_external  = false
  min_replicas = 1
  max_replicas = 1

  secrets = local.db_secrets

  env_vars = concat(local.db_env, [
    { name = "SPRING_PROFILES_ACTIVE", value = "default" },
    { name = "DB_URL", value = "${local.db_connection_base}/orderdb?sslmode=require" },
    { name = "CUSTOMER_SERVICE_GRPC_HOST", value = "customer-service" },
    { name = "CUSTOMER_SERVICE_GRPC_PORT", value = "9096" },
  ])

  secret_env_vars = local.db_secret_env

  depends_on = [module.postgres, module.customer_service]

  resource_group_name          = local.common_app_args.resource_group_name
  container_app_environment_id = local.common_app_args.container_app_environment_id
  acr_login_server             = local.common_app_args.acr_login_server
  acr_username                 = local.common_app_args.acr_username
  acr_password                 = local.common_app_args.acr_password
  image_tag                    = local.common_app_args.image_tag
}

# ──────────────────────────────────────────────
# Payment Service
# ──────────────────────────────────────────────
module "payment_service" {
  source = "./modules/container-app"

  name       = "payment-service"
  image_name = "payment-service"

  target_port  = 8083
  is_external  = false
  min_replicas = 1
  max_replicas = 1

  secrets = concat(local.db_secrets, [
    { name = "stripe-secret-key", value = var.stripe_secret_key },
    { name = "stripe-webhook-secret", value = var.stripe_webhook_secret },
  ])

  env_vars = concat(local.db_env, [
    { name = "SPRING_PROFILES_ACTIVE", value = "default" },
    { name = "DB_URL", value = "${local.db_connection_base}/paymentdb?sslmode=require" },
    { name = "ORDER_SERVICE_URL", value = "http://order-service" },
  ])

  secret_env_vars = concat(local.db_secret_env, [
    { name = "STRIPE_SECRET_KEY", secret_name = "stripe-secret-key" },
    { name = "STRIPE_WEBHOOK_SECRET", secret_name = "stripe-webhook-secret" },
  ])

  depends_on = [module.postgres, module.order_service]

  resource_group_name          = local.common_app_args.resource_group_name
  container_app_environment_id = local.common_app_args.container_app_environment_id
  acr_login_server             = local.common_app_args.acr_login_server
  acr_username                 = local.common_app_args.acr_username
  acr_password                 = local.common_app_args.acr_password
  image_tag                    = local.common_app_args.image_tag
}

# ──────────────────────────────────────────────
# API Gateway
# ──────────────────────────────────────────────
module "gateway" {
  source = "./modules/container-app"

  name       = "gateway"
  image_name = "gateway"

  target_port  = 8080
  is_external  = false
  min_replicas = 1
  max_replicas = 1

  secrets = []

  env_vars = [
    { name = "AUTH_SERVICE_URL", value = "http://auth-service" },
    { name = "CUSTOMER_SERVICE_URL", value = "http://customer-service" },
    { name = "ORDER_SERVICE_URL", value = "http://order-service" },
    { name = "PAYMENT_SERVICE_URL", value = "http://payment-service" },
  ]

  depends_on = [
    module.auth_service,
    module.customer_service,
    module.order_service,
    module.payment_service,
  ]

  resource_group_name          = local.common_app_args.resource_group_name
  container_app_environment_id = local.common_app_args.container_app_environment_id
  acr_login_server             = local.common_app_args.acr_login_server
  acr_username                 = local.common_app_args.acr_username
  acr_password                 = local.common_app_args.acr_password
  image_tag                    = local.common_app_args.image_tag
}

# ──────────────────────────────────────────────
# Frontend
# ──────────────────────────────────────────────
module "frontend" {
  source = "./modules/container-app"

  name       = "frontend"
  image_name = "frontend"

  target_port  = 80
  is_external  = true
  min_replicas = 1
  max_replicas = 1

  secrets  = []
  env_vars = []

  resource_group_name          = local.common_app_args.resource_group_name
  container_app_environment_id = local.common_app_args.container_app_environment_id
  acr_login_server             = local.common_app_args.acr_login_server
  acr_username                 = local.common_app_args.acr_username
  acr_password                 = local.common_app_args.acr_password
  image_tag                    = local.common_app_args.image_tag
}
