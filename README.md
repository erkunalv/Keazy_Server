# Keazy Service Discovery Platform (Prototype)

Keazy is a voice-enabled service discovery platform for Tier 2/3 Indian cities.  
This repo contains the **backend**, **ML microservice**, and **admin frontend** setup that powers intent classification, provider matching, logging, and retraining.

---

## 📂 Project Structure

- **keazy-backend** → Node.js + Express backend  
  - Modular routes (`admin/ml`, `providers`, `services`, etc.)  
  - Models (`User`, `Provider`, `Service`, `Slot`, `Query`, `RetrainHistory`, `Job`, `Event`)  
  - Two-layer architecture: rule-based filtering first, ML fallback second  
  - Integrated feedback loop for retraining  

- **ml-service** → Python + Flask microservice  
  - Trains and serves intent classification model  
  - Exposes `/predict` and `/retrain` endpoints for backend integration  
  - Generates `intent_model.pkl` and `vectorizer.pkl`  

- **keazy-admin** → Frontend dashboard (React/MUI)  
  - Admin CRUD for services, slots, users  
  - Logs viewer and retraining controls  
  - Metrics and oversight for human-in-the-loop validation  

- **docker-compose.yml** → Containerized orchestration of backend, ML service, MongoDB, Prometheus, Grafana

---

## 📦 Prerequisites

- **Docker** + **Docker Compose** (for containerized setup)  
- **Node.js** (>= 18.x) if running backend locally  
- **Python** (>= 3.10) if running ML service locally  
- **MongoDB** (containerized or local)  
- **Git** (for cloning and version control)  
- **Postman** (for API testing)  

---

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/Keazy_Server.git
cd Keazy_Server
```
Note: All feature branches must originate from Dev. Only Dev merges into main.

### 2. Start services with Docker
```bash
docker compose up -d
```
This will start:
- Backend on http://localhost:3000
- ML service on http://localhost:5000
- Grafana/Prometheus on http://localhost:9090

### 3. Seed data in Docker Desktop
```bash
docker compose exec backend node seed/seed.js
docker compose exec backend node seed/seedQueries.js
docker compose exec backend node seed/seedLogs.js
```

### 4. Retrain ML model
```bash
docker compose exec mlservice python train_model.py
docker compose restart mlservice
```

### 🚀 Running Locally (Optional)
If you prefer not to use Docker:
- Start MongoDB locally
- Train ML model with
```
python train_model.py
```
- Run Flask microservice with 
```
python app.py
```

Start backend with
```
npm run dev
```

Start admin frontend with
```
npm run dev
```

### 🧪 Testing
Use Postman with the provided collection (keazy-backend/postman/Keazy.postman_collection.json):

- Predict:  
POST http://localhost:3000/api/admin/ml/predict

- Correct prediction:  
POST http://localhost:3000/api/admin/ml/logs/:id/correct

- Feedback:  
POST http://localhost:3000/api/admin/ml/logs/:id/feedback

- Fetch logs:  
GET http://localhost:3000/api/admin/ml/logs

- Retrain:  
POST http://localhost:3000/api/admin/ml/retrain

### 📐 Architecture Recap

#### Layer 1: Rule-based filtering

- Synonyms + manual heuristics
- Provider matching by service + location

#### Layer 2: ML-powered classification

- Intent model predicts service when rule-based fails
- Confidence scores logged for admin oversight
- Feedback Loop
- Queries logged in Query collection
- Admin dashboard approves/rejects predictions
- Retraining triggered from dashboard using confirmed logs

### Built by Kunal Verma
Founder at Key Systems and Technologies (KeySysTech)