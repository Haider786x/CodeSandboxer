FROM node:18-alpine

# Install Python 3, Java 17, and Docker CLI (so the judge can run local OR docker mode)
RUN apk update && \
    apk add --no-cache python3 openjdk17 docker-cli

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY src ./src

# Ensure local temp directory exists
RUN mkdir -p /app/temp

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
