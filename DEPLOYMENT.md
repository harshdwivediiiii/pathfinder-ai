# Deployment Instructions for Pathfinder AI

This document outlines the steps to deploy your Dockerized Next.js 15 application to various platforms.

## Prerequisites

Before deploying, ensure you have:

*   **Docker and Docker Compose:** Installed on your deployment machine (if deploying directly to VPS/EC2/DigitalOcean).
*   **Git:** To clone your repository.
*   **Environment Variables:** All required environment variables set for your production environment. Refer to `.env.example` for a list of variables. **Never commit sensitive environment variables to your repository.** Use your platform's secret management features.
*   **GitHub Container Registry (GHCR) Access:** If pushing/pulling images from GHCR, ensure your `GITHUB_TOKEN` has `packages:write` permission for pushing and `packages:read` for pulling.

---

## Local Deployment with Docker Desktop

For local development and testing, you can use Docker Desktop.

1.  **Clone the repository:**
    ```bash
    git clone [your-repo-url]
    cd pathfinder-ai
    ```
2.  **Create a `.env` file:**
    Copy `.env.example` to `.env` and fill in your actual environment variables. The `docker-compose.yml` is configured to automatically pick up variables from this `.env` file.
    ```bash
    cp .env.example .env
    # Edit .env with your specific values (e.g., actual database URL, Clerk keys, etc.)
    ```
    For local PostgreSQL and Redis, you can use the values specified in `docker-compose.yml` (e.g., `DATABASE_URL="postgresql://user:password@db:5432/pathfinder-ai"`).
3.  **Build and run the services:**
    ```bash
    docker compose up --build -d
    ```
    This will build the Docker image for your application, start the PostgreSQL and Redis containers, and run your Next.js application.
4.  **Access the application:**
    Open your browser and navigate to `http://localhost:3000`.

---

## Manual Deployment (Ubuntu VPS, EC2, DigitalOcean)

This method involves SSH'ing into your server and manually deploying using Docker and Docker Compose.

1.  **Provision your server:**
    *   Launch an Ubuntu server (e.g., on EC2, DigitalOcean droplet, or a standard VPS).
    *   Ensure port `3000` (for your Next.js app) and optionally `5432` (PostgreSQL) and `6379` (Redis) are open in your firewall/security groups if you plan to access them directly or use the locally deployed database/redis.
2.  **SSH into your server:**
    ```bash
    ssh your_user@your_server_ip
    ```
3.  **Install Docker and Docker Compose:**
    Follow the official Docker documentation to install Docker Engine and Docker Compose on your Ubuntu server.
    ```bash
    # Example for Docker:
    sudo apt-get update
    sudo apt-get install ca-certificates curl
    sudo install -m 0555 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    echo 
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu 
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | 
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add your user to the docker group to run docker commands without sudo
    sudo usermod -aG docker $USER
    newgrp docker # Apply group changes immediately
    ```
4.  **Clone your repository:**
    ```bash
    git clone [your-repo-url]
    cd pathfinder-ai
    ```
5.  **Create a `.env` file:**
    Copy `.env.example` to `.env` and fill in your actual production environment variables. These variables should point to your *production* PostgreSQL (e.g., Neon) and Redis (e.g., Upstash) instances.
    ```bash
    cp .env.example .env
    # Edit .env with your specific production values
    ```
6.  **Pull the Docker image (if using GHCR) or build it locally:**

    *   **Option A: Pull from GHCR (Recommended for CI/CD builds)**
        If you have set up the CI/CD workflow to push to GHCR, you can pull the image:
        ```bash
        docker login ghcr.io -u your_github_username -p your_github_token # Use a fine-grained token with package read access
        docker pull ghcr.io/your_github_username/your_repo_name:latest
        ```
        Then, modify your `docker-compose.yml` to use `image: ghcr.io/your_github_username/your_repo_name:latest` instead of `build: .` for the `app` service.

    *   **Option B: Build locally on the server**
        ```bash
        docker compose up --build -d
        ```
        This will build the image directly on your server. Ensure your server has enough resources.

7.  **Access the application:**
    Open your browser and navigate to `http://your_server_ip:3000`.

---

## Railway

Railway offers a simple way to deploy Dockerized applications.

1.  **Connect your GitHub repository:**
    Go to Railway and create a new project. Connect your GitHub repository.
2.  **Configure environment variables:**
    In your Railway project settings, add all your production environment variables (e.g., `DATABASE_URL`, `REDIS_URL`, Clerk keys, Gemini API key, Inngest keys).
3.  **Railway detects Dockerfile:**
    Railway will automatically detect your `Dockerfile` and attempt to build and deploy your application.
4.  **Database and Redis:**
    You can either use Railway's managed PostgreSQL and Redis services (and update your `DATABASE_URL` and `REDIS_URL` accordingly) or connect to external providers like Neon and Upstash.
5.  **Deploy:**
    Trigger a deployment from your Railway dashboard.

---

## Coolify

Coolify is an open-source, self-hostable Heroku/Netlify alternative.

1.  **Set up Coolify:**
    Install Coolify on your own server (VPS).
2.  **Connect your Git Repository:**
    In Coolify, create a new application and connect it to your GitHub repository.
3.  **Configure Build & Deploy:**
    *   Coolify should detect your `Dockerfile`.
    *   Set the `Build Command` to `npm ci && npx prisma generate && npm run build`.
    *   Set the `Start Command` to `sh -c "npx prisma migrate deploy && node server.js"`.
4.  **Environment Variables:**
    Add your production environment variables through the Coolify UI.
5.  **Database and Redis:**
    Coolify can provision databases (PostgreSQL) and Redis instances. Connect your application to these or external services.
6.  **Deploy:**
    Trigger a deployment within Coolify.

---

## Portainer

Portainer is a container management UI that can be used on any Docker environment.

1.  **Install Portainer:**
    Follow the official Portainer documentation to install it on your server.
2.  **Access Portainer UI:**
    Navigate to the Portainer web interface.
3.  **Deploy as a Stack (Docker Compose):**
    *   In Portainer, go to `Stacks` -> `Add stack`.
    *   Give your stack a name.
    *   Either paste the content of your `docker-compose.yml` directly or upload the file.
    *   **Environment Variables:** You'll need to define your environment variables. You can either hardcode them in the `docker-compose.yml` (not recommended for secrets) or configure them within Portainer's environment variables section for the stack/application.
    *   Click `Deploy the stack`.
4.  **Manual Image Deployment (if not using compose):**
    If you prefer to deploy individual containers:
    *   Pull your image from GHCR: `docker pull ghcr.io/your_github_username/your_repo_name:latest`
    *   In Portainer, go to `Containers` -> `Add container`.
    *   Enter the image name, configure port mappings (`3000:3000`), add environment variables, and link to your PostgreSQL and Redis containers (if managed separately).

---

## Key Considerations for Production

*   **Secrets Management:** Use platform-specific secret management (e.g., AWS Secrets Manager, DigitalOcean 환경 variables, Railway/Coolify secrets) rather than `.env` files in production.
*   **Database Migrations:** The `docker-compose.yml` includes `npx prisma migrate deploy`. Ensure this is appropriate for your deployment strategy. For more complex setups, you might run migrations as a separate step or a dedicated migration service.
*   **Persistent Storage:** Ensure volumes for databases and Redis are properly configured for persistence, especially if using them on the same host as your application.
*   **Monitoring and Logging:** Integrate with your preferred monitoring and logging solutions.
*   **Scalability:** For high-traffic applications, consider orchestrators like Kubernetes or cloud-managed services (ECS, EKS, Cloud Run) for better scalability and resilience.
*   **Health Checks:** The provided `healthcheck` in `docker-compose.yml` assumes an `/api/health` endpoint. Ensure this endpoint exists and returns a 200 OK status.
