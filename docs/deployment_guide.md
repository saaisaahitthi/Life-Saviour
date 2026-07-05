# COMPLETE DEPLOYMENT GUIDE
**Project:** Life Saviour  
**Stack:** MERN (MongoDB, Express, React, Node.js) + WebSockets

This guide details the complete operational lifecycle of the Life Saviour platform, from spinning up local development environments to provisioning high-availability production clusters.

---

## 1. Local Development
To run the application locally, you need Node.js (v18+) and MongoDB (Local or Atlas).

**Backend Setup:**
```bash
cd server
npm install
npm run dev # Starts nodemon on http://localhost:5000
```

**Frontend Setup:**
```bash
cd client
npm install
npm run dev # Starts Vite server on http://localhost:5173
```

## 2. Environment Variables
You must create `.env` files in both the client and server root directories.

**server/.env**
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/lifesaviour
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=AIzaSy_your_google_gemini_key_here
```

**client/.env**
```env
VITE_API_URL=http://localhost:5000/api
```

## 3. Docker & 4. Build Process
Dockerizing the application ensures consistency across environments.

**Backend Dockerfile (`server/Dockerfile`):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Frontend Build Process (`client/Dockerfile`):**
The frontend is built statically via Vite and served by Nginx.
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Outputs static files to /app/dist
RUN npm run build 

FROM nginx:alpine
# Copy static files to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom Nginx config (see section 6)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 5. Production Deployment
- **Frontend (Static):** The easiest, most performant deployment for the React/Vite client is a CDN edge network like **Vercel** or **Netlify**. Alternatively, use the Nginx Docker container above.
- **Backend (Node.js):** Deploy the Docker container to a PaaS like **Render, Railway, or AWS Elastic Beanstalk**.
- **Database:** **MongoDB Atlas** (Managed Cloud DB) is highly recommended for automated backups, replication, and scaling.

## 6. Nginx & 7. Reverse Proxy
If deploying both the frontend and backend on a single VM (like a DigitalOcean Droplet), you must use Nginx as a reverse proxy. 

**CRITICAL CONFIGURATION:** Nginx must explicitly support **WebSocket Upgrades**, otherwise Socket.IO connections will fail and fall back to slow HTTP long-polling.

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name lifesaviour.com;

    # Serve React Static Files
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html; # Required for React Router
    }

    # Proxy API Requests to Node.js
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy Socket.IO WebSockets (CRITICAL)
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade"; # Enables WebSockets
        proxy_set_header Host $host;
    }
}
```

## 8. SSL (HTTPS)
SSL is **MANDATORY** for Life Saviour. 
- The **WebRTC API** (PeerJS Video Calls) and the **Web Bluetooth API** (Wearable integration) will throw fatal security errors in modern browsers if served over plain HTTP.
- **Implementation:** Use `certbot` (Let's Encrypt) to auto-provision and renew SSL certificates for your Nginx server.

## 9. CI/CD (Continuous Integration & Deployment)
Use **GitHub Actions** for an automated pipeline:
1. **Lint & Test:** Run `eslint` and automated test suites on every pull request.
2. **Build Client:** If tests pass on the `main` branch, run `npm run build` in the client.
3. **Build Server Image:** Build the backend Docker image.
4. **Push & Deploy:** Push the image to AWS ECR or Docker Hub and trigger a webhook on your production server to pull and restart the container.

## 10. Monitoring & 11. Logging
- **Process Manager:** If running raw Node on a VM, use **PM2** (`pm2 start server.js`). PM2 automatically restarts the app if it crashes.
- **Logging:** Replace `console.log` with a structured logger like **Winston**. Output logs as JSON so they can be parsed by an ELK stack (Elasticsearch, Logstash, Kibana) or Datadog.
- **APM (Application Performance Monitoring):** Integrate Datadog or New Relic to monitor memory leaks, API latency, and database query bottlenecks.

## 12. Scaling Strategies
Life Saviour is stateless in authentication (JWT) but **stateful in WebSockets**. To scale horizontally across multiple instances behind a load balancer:
1. **Sticky Sessions:** Your Load Balancer (AWS ALB / Nginx) MUST be configured with sticky sessions (IP Hash routing) so a user's WebSocket packets always hit the same Node container.
2. **Redis Adapter:** You must install `@socket.io/redis-adapter` and connect your Node instances to a Redis cluster. This allows an emergency chat message received by Node Instance A to be broadcast out through Node Instance B to a user connected there.
3. **File Storage Migration:** Currently, Multer saves medical files to the local `/uploads/` directory. You **must** refactor this to use `multer-s3` so files are saved centrally to AWS S3. Otherwise, user files will be scattered across different instances.

## 13. Backup Strategy
- **Database:** Use MongoDB Atlas automated continuous backups with point-in-time recovery. If self-hosting, configure a cron job to run `mongodump` daily and upload the archive to an offsite S3 bucket.
- **File Storage:** If using local disk storage for Multer, ensure the `/uploads/` directory is mounted to an external volume (like AWS EBS) and backed up nightly. If using AWS S3 (recommended), enable bucket versioning to prevent accidental file deletion.
