# ---- Build Stage ----
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy parent POM
COPY pom.xml .

# Copy ALL module POMs so Maven can resolve the multi-module structure
COPY item-service/pom.xml    item-service/pom.xml
COPY order-service/pom.xml   order-service/pom.xml
COPY payment-service/pom.xml payment-service/pom.xml
COPY gateway/pom.xml         gateway/pom.xml

# Copy only this module's source
COPY payment-service/src payment-service/src

# Install parent POM (resolves module graph)
RUN mvn install -N -DskipTests --no-transfer-progress

# Build payment-service only
RUN mvn package -pl payment-service -DskipTests --no-transfer-progress

# ---- Runtime Stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=builder /app/payment-service/target/payment-service-*.jar app.jar

EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]
