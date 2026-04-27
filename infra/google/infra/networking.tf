resource "google_compute_network" "vpc" {
  name                    = "${local.name_prefix}-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.apis]
}

# /28 subnet dedicated to the Serverless VPC Access connector
resource "google_compute_subnetwork" "connector" {
  name          = "${local.name_prefix}-connector-subnet"
  ip_cidr_range = "10.8.0.0/28"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# IP range reserved for Private Service Access (Cloud SQL private IP)
resource "google_compute_global_address" "private_ip_range" {
  name          = "${local.name_prefix}-sql-private-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]
  depends_on              = [google_project_service.apis]
}

# Serverless VPC Access connector — lets Cloud Run reach the Cloud SQL private IP
resource "google_vpc_access_connector" "connector" {
  name   = "${local.name_prefix}-connector"
  region = var.region

  subnet {
    name = google_compute_subnetwork.connector.name
  }

  machine_type  = "e2-micro"
  min_instances = 2
  max_instances = 3

  depends_on = [google_project_service.apis]
}
