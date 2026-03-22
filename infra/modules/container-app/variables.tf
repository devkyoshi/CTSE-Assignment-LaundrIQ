variable "name" {
  description = "Name of the Container App"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "container_app_environment_id" {
  description = "ID of the Container Apps Environment"
  type        = string
}

variable "acr_login_server" {
  description = "ACR login server URL"
  type        = string
}

variable "acr_username" {
  description = "ACR admin username"
  type        = string
}

variable "acr_password" {
  description = "ACR admin password"
  type        = string
  sensitive   = true
}

variable "image_name" {
  description = "Docker image name (without registry prefix)"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "target_port" {
  description = "Port the container listens on"
  type        = number
}

variable "is_external" {
  description = "Whether the app is externally accessible"
  type        = bool
  default     = false
}

variable "transport" {
  description = "Ingress transport protocol (auto, http, http2, tcp)"
  type        = string
  default     = "auto"
}

variable "env_vars" {
  description = "Environment variables (non-secret)"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "secret_env_vars" {
  description = "Environment variables that reference secrets"
  type = list(object({
    name        = string
    secret_name = string
  }))
  default = []
}

variable "secrets" {
  description = "Secret values for the container app"
  type = list(object({
    name  = string
    value = string
  }))
  default   = []
  sensitive = true
}

variable "cpu" {
  description = "CPU cores allocated"
  type        = number
  default     = 0.25
}

variable "memory" {
  description = "Memory allocated (e.g., 0.5Gi)"
  type        = string
  default     = "0.5Gi"
}

variable "min_replicas" {
  description = "Minimum number of replicas"
  type        = number
  default     = 0
}

variable "max_replicas" {
  description = "Maximum number of replicas"
  type        = number
  default     = 1
}
