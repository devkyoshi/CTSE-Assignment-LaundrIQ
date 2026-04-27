# LaundrIQ — Google Cloud Run Deployment

This directory contains all infrastructure-as-code for deploying LaundrIQ to Google Cloud Run using Terraform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Google Cloud Project                      │
│                                                                   │
│   Artifact Registry          Cloud SQL (PostgreSQL 16)           │
│   └── laundriq/              └── private IP (VPC only)          │
│       ├── auth-service           ├── authdb                      │
│       ├── customer-service       ├── customer_db                 │
│       ├── order-service          ├── orderdb                     │
│       ├── payment-service        └── paymentdb                   │
│       ├── gateway                                                 │
│       └── frontend           Secret Manager                      │
│                              ├── db-password                     │
│   Cloud Run Services         ├── jwt-secret                      │
│   ├── frontend (public)      ├── admin-password                  │
│   ├── gateway (public)       ├── stripe-secret-key               │
│   ├── auth-service*          └── stripe-webhook-secret           │
│   ├── customer-service*                                           │
│   ├── customer-service-grpc* VPC                                 │
│   ├── order-service*         └── laundriq-vpc                    │
│   └── payment-service*           └── VPC connector               │
│         * internal only              (Cloud Run → Cloud SQL)     │
└─────────────────────────────────────────────────────────────────┘
```

**Traffic flow:**
```
User → frontend (nginx) → /api/* → gateway (Spring Cloud Gateway)
                                        ├── /api/auth/**      → auth-service:8084
                                        ├── /api/customers/** → customer-service:8086
                                        ├── /api/orders/**    → order-service:8082
                                        └── /api/payments/**  → payment-service:8083

order-service ──gRPC──→ customer-service-grpc:9096
```

The frontend and gateway are publicly accessible. All backend services are restricted to internal Cloud Run traffic only (`INGRESS_TRAFFIC_INTERNAL_ONLY`).

---

## Terraform modules

The infrastructure is split into three independent Terraform roots, each run with a single command and stored in separate state files in the same GCS bucket.

```
infra/google/
├── bootstrap/   ← Run once locally — creates CI/CD service account, pushes all GitHub secrets
├── infra/       ← Run once locally — creates all persistent GCP resources
└── deploy/      ← Run by CI on every push to main — updates Cloud Run image tags
```

| Module | State prefix | Who runs it | When |
|--------|-------------|-------------|------|
| `bootstrap/` | `terraform/bootstrap` | Developer (local) | Once, before first deploy |
| `infra/` | `terraform/infra` | Developer (local) | Once, then only when infra changes |
| `deploy/` | `terraform/deploy` | GitHub Actions | Every push to `main` |

---

## Prerequisites

Install and verify:

```bash
gcloud version      # Google Cloud SDK
terraform version   # must be >= 1.5.0
```

Authenticate gcloud:

```bash
gcloud auth login
gcloud auth application-default login
```

---

## Step 0 — Create a GCP project and state bucket

If you don't have a GCP project yet:

```bash
gcloud projects create ctse-laundriq --name="LaundrIQ"
gcloud config set project ctse-laundriq
```

Enable billing on the project at [console.cloud.google.com/billing](https://console.cloud.google.com/billing) — Cloud SQL and Cloud Run both require an active billing account.

Create the GCS bucket that stores Terraform state for all three modules. The bucket name must be globally unique:

```bash
gcloud storage buckets create gs://ctse-laundriq-tfstate \
  --location=asia-south1 \
  --uniform-bucket-level-access

gcloud storage buckets update gs://ctse-laundriq-tfstate --versioning
```

---

## Step 1 — Bootstrap

The bootstrap module does two things:
- Creates a dedicated CI/CD service account (`laundriq-ci-sa`) with the permissions needed to run Terraform and push Docker images
- Pushes all required secrets and variables directly to GitHub Actions so you never have to set them manually

### Create a GitHub Personal Access Token

Go to **github.com → Settings → Developer settings → Personal access tokens → Generate new token (classic)**.

Give it the `repo` scope. Copy the token.

### Fill in the tfvars

```bash
cd infra/google/bootstrap
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
project_id      = "ctse-laundriq"
region          = "asia-south1"
tf_state_bucket = "ctse-laundriq-tfstate"

github_owner = "silverviles"
github_repo  = "CTSE-Assignment-LaundrIQ"
github_token = "ghp_..."

db_password            = "a-strong-password"
jwt_secret             = ""   # generate: openssl rand -base64 64
admin_password         = "admin@1234"
stripe_secret_key      = "sk_test_..."
stripe_webhook_secret  = "whsec_..."
stripe_publishable_key = "pk_test_..."
```

Generate `jwt_secret`:
```bash
openssl rand -base64 64
```

### Apply

```bash
terraform init -backend-config="bucket=ctse-laundriq-tfstate"
terraform apply -var-file=terraform.tfvars
```

Runtime: ~2 minutes. When complete, all GitHub Actions secrets will be live in your repository. Verify at:
`github.com/silverviles/CTSE-Assignment-LaundrIQ/settings/secrets/actions`

You should see these secrets created:

| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID` | GCP project ID |
| `GCP_SA_KEY` | CI/CD service account JSON key |
| `GCP_TF_STATE_BUCKET` | State bucket name |
| `DB_PASSWORD` | Cloud SQL user password |
| `JWT_SECRET` | JWT signing secret |
| `ADMIN_PASSWORD` | Seed admin account password |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (baked into frontend image) |

And one repository variable: `GCP_REGION`.

---

## Step 2 — Infra

The infra module creates all persistent GCP resources:

- **VPC** — `laundriq-vpc` with a dedicated `/28` subnet for the VPC connector
- **Private Service Access** — peering so Cloud SQL gets a private IP on the VPC
- **Serverless VPC Access Connector** — lets Cloud Run egress to the Cloud SQL private IP
- **Artifact Registry** — Docker repository `laundriq` for all service images
- **Cloud SQL** — PostgreSQL 16 (`db-f1-micro`), private IP only, 4 databases
- **Secret Manager** — 5 secrets for runtime credentials
- **Cloud Run Runtime SA** — `laundriq-run-sa` with `cloudsql.client`, `secretmanager.secretAccessor`, `artifactregistry.reader`

### Fill in the tfvars

```bash
cd ../infra
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with the same values used in bootstrap (same passwords/secrets, no GitHub token needed):

```hcl
project_id     = "ctse-laundriq"
region         = "asia-south1"
ar_repo_name   = "laundriq"
db_tier        = "db-f1-micro"
admin_username = "admin"
admin_email    = "admin@mail.com"

db_password           = "a-strong-password"
jwt_secret            = "..."
admin_password        = "admin@1234"
stripe_secret_key     = "sk_test_..."
stripe_webhook_secret = "whsec_..."
```

### Apply

```bash
terraform init -backend-config="bucket=ctse-laundriq-tfstate"
terraform apply -var-file=terraform.tfvars
```

Runtime: **10–15 minutes** — Cloud SQL provisioning is the slow step.

Expected outputs:
```
artifact_registry_repo = "asia-south1-docker.pkg.dev/ctse-laundriq/laundriq"
cloud_run_sa_email     = "laundriq-run-sa@ctse-laundriq.iam.gserviceaccount.com"
cloud_sql_connection_name = "ctse-laundriq:asia-south1:laundriq-postgres"
```

---

## Step 3 — Deploy (automated from here)

Push to `main` to trigger the GitHub Actions pipeline:

```bash
git add .
git commit -m "feat: deploy to Cloud Run"
git push origin main
```

The pipeline (`.github/workflows/deploy_google.yml`) runs two jobs:

### Job 1: Build & Push Images (~8–12 min)

Builds all six Docker images using the Maven layer cache and pushes them to Artifact Registry with two tags:
- `:latest`
- `:<git-commit-sha>` — the tag used for this specific deployment

Images built:
- `auth-service`, `customer-service`, `order-service`, `payment-service`, `gateway` — from `./backend` using their individual Dockerfiles
- `frontend` — from `./frontend`, with `NGINX_CONF=nginx.gcp.conf` and the Stripe publishable key baked in at build time

### Job 2: Terraform Deploy (~3–5 min)

Runs `terraform apply` in `infra/google/deploy/` with `image_tag` set to the commit SHA. This updates all seven Cloud Run services to run the newly pushed images.

The deploy module reads all infra state (Cloud SQL IP, VPC connector, service account, secret IDs) from live GCP data sources — it doesn't need any secrets itself.

### Outputs

When the pipeline completes, check the Terraform Deploy job logs for:
```
frontend_url = "https://frontend-xxxx-el.a.run.app"
gateway_url  = "https://gateway-xxxx-el.a.run.app"
```

Open `frontend_url` in a browser.

---

## Cloud Run services

| Service | Port | Ingress | Notes |
|---------|------|---------|-------|
| `frontend` | 80 | Public | nginx serves SPA; proxies `/api/*` to gateway |
| `gateway` | 8080 | Public | Spring Cloud Gateway; routes to all backend services |
| `auth-service` | 8084 | Internal | JWT issuance and validation |
| `customer-service` | 8086 | Internal | HTTP REST; used by gateway |
| `customer-service-grpc` | 9096 | Internal | Same image as customer-service; HTTP/2 (`h2c`) for gRPC; used by order-service |
| `order-service` | 8082 | Internal | Calls customer-service-grpc on port 443 |
| `payment-service` | 8083 | Internal | Stripe integration |

All services scale to zero when idle (`min_instance_count = 0`). Expect a 15–30 second cold start on the first request after a period of inactivity.

---

## Post-deployment

### Stripe webhook

Once you have the gateway URL, register the webhook endpoint in your Stripe dashboard:

```
https://<gateway-url>/api/payments/webhook
```

### Update CORS origin

The gateway's `FRONTEND_ORIGIN` is set to `""` on first deploy (the frontend URL isn't known until after deployment). To enable strict CORS, run this once after the first deploy:

```bash
cd infra/google/deploy
terraform apply -var-file=terraform.tfvars \
  -var="image_tag=latest" \
  -var="frontend_origin=https://frontend-xxxx-el.a.run.app"
```

Or simply leave it empty — the gateway still works; it just allows all origins.

---

## Day-to-day operations

### Deploying a new version

Just push to `main`. The pipeline handles everything.

### Updating a secret (e.g. rotating Stripe keys)

Update the value in `infra/terraform.tfvars` and re-apply infra:

```bash
cd infra/google/infra
terraform apply -var-file=terraform.tfvars
```

Cloud Run picks up the new secret version on the next request (Secret Manager versions are pinned to `latest`).

### Scaling services

Edit `min_instance_count` / `max_instance_count` in `deploy/cloud_run.tf` and push to main.

### Changing infra (e.g. upgrading Cloud SQL tier)

Edit the relevant file in `infra/google/infra/`, then:

```bash
cd infra/google/infra
terraform apply -var-file=terraform.tfvars
```

---

## Pausing billing between sessions

Cloud Run scales to zero automatically (`min_instance_count = 0`) — it costs nothing when no requests are being made. The resources that bill continuously regardless are:

| Resource                    | Always-on cost    | Can be paused?          |
|-----------------------------|-------------------|-------------------------|
| Cloud SQL (`db-f1-micro`)   | ~$7–9/month       | Yes — stop the instance |
| VPC connector (2× e2-micro) | ~$9/month         | Only by deleting it     |
| Artifact Registry           | ~$0.10/GB/month   | Nothing needed, minimal |

### Stop Cloud SQL (recommended between sessions)

Suspends compute billing while keeping all data intact. Storage is still billed at rest (~$0.17/GB/month) but that is negligible.

```bash
# Pause
gcloud sql instances patch laundriq-postgres --activation-policy=NEVER

# Resume before next use
gcloud sql instances patch laundriq-postgres --activation-policy=ALWAYS
```

> The app will return errors while Cloud SQL is stopped — start it again before demoing.

### Fully zero cost between sessions

The only way to eliminate the VPC connector cost is to destroy the infra and redeploy when needed. Since all images remain in Artifact Registry, redeployment is fast (no rebuilds needed):

```bash
# Tear down Cloud Run services and infra
cd infra/google/deploy && terraform destroy -var="project_id=ctse-laundriq" -var="region=asia-south1" -var="image_tag=latest"
cd ../infra && terraform destroy -var-file=terraform.tfvars

# Restore everything later
cd infra/google/infra && terraform apply -var-file=terraform.tfvars
# Then push to main (or run deploy/ manually) to redeploy Cloud Run services
```

---

## Teardown

To destroy all Cloud Run services (preserves infra):

```bash
cd infra/google/deploy
terraform destroy -var="project_id=ctse-laundriq" -var="region=asia-south1" -var="image_tag=latest"
```

To destroy all persistent infra (Cloud SQL, AR, VPC, secrets):

```bash
cd infra/google/infra
terraform destroy -var-file=terraform.tfvars
```

To destroy the CI SA and revoke GitHub secrets:

```bash
cd infra/google/bootstrap
terraform destroy -var-file=terraform.tfvars
```

> Cloud SQL deletion can take several minutes. The `deletion_protection = false` flag is intentionally set to allow clean teardown in this environment.
