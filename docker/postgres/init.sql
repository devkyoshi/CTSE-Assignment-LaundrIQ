-- Creates a dedicated database for each microservice.
-- This script is run once when the postgres container is first initialised
-- (mounted at /docker-entrypoint-initdb.d/).

CREATE DATABASE authdb;
CREATE DATABASE pricingdb;
CREATE DATABASE orderdb;
CREATE DATABASE paymentdb;

-- Grant all privileges to the shared application user
GRANT ALL PRIVILEGES ON DATABASE authdb    TO ctse;
GRANT ALL PRIVILEGES ON DATABASE pricingdb TO ctse;
GRANT ALL PRIVILEGES ON DATABASE orderdb   TO ctse;
GRANT ALL PRIVILEGES ON DATABASE paymentdb TO ctse;
