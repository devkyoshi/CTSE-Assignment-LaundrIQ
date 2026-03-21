# ---- Build Stage ----
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy parent POM
COPY pom.xml .

# Copy ALL module POMs so Maven can resolve the multi-module structure
COPY auth-service/pom.xml    auth-service/pom.xml
COPY common/pom.xml          common/pom.xml
COPY customer-service/pom.xml customer-service/pom.xml
COPY gateway/pom.xml         gateway/pom.xml
COPY grpc-lib/pom.xml        grpc-lib/pom.xml
COPY order-service/pom.xml   order-service/pom.xml
COPY payment-service/pom.xml payment-service/pom.xml

# Copy only this module's source and common dependencies it might need
COPY auth-service/src auth-service/src
COPY common/src common/src
COPY grpc-lib/src grpc-lib/src

# Install parent POM (resolves module graph)
RUN mvn install -N -DskipTests --no-transfer-progress

# Build auth-service, common and grpc-lib
RUN mvn package -pl auth-service -am -DskipTests --no-transfer-progress

# ---- Runtime Stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /app/auth-service/target/auth-service-*.jar app.jar

EXPOSE 8084 9094
ENTRYPOINT ["java", "-jar", "app.jar"]
