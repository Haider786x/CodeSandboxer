# Java sandbox runner image.
# Uses eclipse-temurin:17-jdk-jammy (the actively maintained successor to
# openjdk:17-slim which is deprecated).
#
# IMPORTANT: The JDK variant is required because the judge compiles Java source
# files inside this container using `javac Main.java` before executing them.
# Do NOT switch to a JRE-only image — that would remove javac and break compilation.
FROM eclipse-temurin:17-jdk-jammy

# Create a non-root user for additional isolation.
RUN useradd -m sandboxuser
USER sandboxuser

WORKDIR /workspace
