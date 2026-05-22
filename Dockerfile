# ===================================================================
# STAGE 1: MAVEN BUILD ENVIRONMENT
# ===================================================================
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build package without running unit tests (to speed up build)
RUN mvn clean package -DskipTests

# ===================================================================
# STAGE 2: RUNTIME ENVIRONMENT
# ===================================================================
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copy the built jar file from the build stage
COPY --from=build /app/target/cloud-crm-portal-1.0.0.jar app.jar

# Expose port 8080
EXPOSE 8080

# Environment variables (Can be overriden during deployment)
ENV SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/crm_db
ENV SPRING_DATASOURCE_USERNAME=postgres
ENV SPRING_DATASOURCE_PASSWORD=123

# Run the spring boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
