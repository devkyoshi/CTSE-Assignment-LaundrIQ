variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
  default     = "ctse-prod"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "environment_name" {
  description = "Name prefix for all resources"
  type        = string
  default     = "ctse-prod"
}

variable "acr_name" {
  description = "Azure Container Registry name (must be globally unique, alphanumeric only)"
  type        = string
  default     = "ctseprodacr"
}

variable "postgres_server_name" {
  description = "PostgreSQL Flexible Server name (must be globally unique)"
  type        = string
  default     = "ctse-prod-pgserver"
}

variable "postgres_admin_username" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "ctseadmin"
}

variable "postgres_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  type        = string
  sensitive   = true
}

variable "admin_username" {
  description = "Default admin username for auth-service"
  type        = string
  default     = "admin"
}

variable "admin_email" {
  description = "Default admin email for auth-service"
  type        = string
  default     = "admin@mail.com"
}

variable "admin_password" {
  description = "Default admin password for auth-service"
  type        = string
  sensitive   = true
}

variable "image_tag" {
  description = "Docker image tag (typically the git commit SHA)"
  type        = string
  default     = "latest"
}
