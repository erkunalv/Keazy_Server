# Keazy Service Discovery Platform (Prototype)

Keazy is a voice-enabled service discovery platform for Tier 2/3 Indian cities.  
This repo contains the **backend**, **ML microservice**, and **admin frontend** setup that powers intent classification, provider matching, logging, and retraining.

---

## 📂 Project Structure

- **keazy-backend** → Node.js + Express backend  
  - Modular routes (`query`, `classify`, `dashboard`, `providers`, etc.)  
  - Models (`User`, `Provider`, `Service`, `Slot`, `Query`, `RetrainHistory`, `Job`, `Event`)  
  - Two-layer architecture: rule-based filtering first, ML fallback second  
  - Integrated feedback loop for retraining  

- **ml-service** → Python + Flask microservice  
  - Trains and serves intent classification model  
  - Exposes `/predict` endpoint for backend integration  
  - Generates `intent_model.pkl` and `vectorizer.pkl`  

- **keazy-admin** → Frontend dashboard (React/MUI)  
  - Admin CRUD for services, slots, users  
  - Logs viewer and retraining controls  
  - Metrics and oversight for human-in-the-loop validation  

---

## 📦 Prerequisites

- **Node.js** (>= 18.x)  
- **Python** (>= 3.10)  
- **MongoDB** (running locally on `mongodb://localhost:27017`)  
- **Git** (for cloning and version control)  
- **Postman** (for API testing)  

---

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/Keazy_Server.git
cd Keazy_Server
```

**Note: It is mandatory to create branches from Dev branch, only final Dev can merge to main, rest all work and releases originate and merge to Dev branch.**

### 2. Backend (Node.js)
```bash
cd keazy-backend
npm install
```

### 3. ML Microservice (Python + Flask)
```bash
cd ml-service
pip install -r requirements.txt
```

### 4. Admin Frontend
```bash
cd keazy-admin
npm install
```

---

## 🚀 Running the System

### 1. Start MongoDB
Make sure MongoDB is running locally:
```bash
net start MongoDB
```

### 2. Train the ML Model
Run the training script to generate model artifacts:
```bash
cd ml-service
python train_model.py
```

Outputs:
- `intent_model.pkl`  
- `vectorizer.pkl`  
- Classification report (printed in console)  

### 3. Start Flask Microservice
```bash
cd ml-service
python app.py
```
Flask will start on:  
`http://127.0.0.1:5000/predict`

### 4. Seed and Start Node Backend
```bash
cd keazy-backend
npm run seed   # seeds providers, services, queries
npm run dev    # starts backend with nodemon
```

Backend will start on:  
- `http://127.0.0.1:3000/query`  
- `http://127.0.0.1:3000/classify`  
- `http://127.0.0.1:3000/dashboard`  

### 5. Start Admin Frontend
```bash
cd keazy-admin
npm run dev
```
Frontend will start on:  
`http://localhost:5173`

---

## 🧪 Testing

- Import the Postman collection:  
  `keazy-backend/postman/Keazy.postman_collection.json`  
- Test endpoints end-to-end:  
  - `/query` → rule-based + ML fallback  
  - `/classify` → ML-only classification  
  - `/dashboard` → logs, services, slots, users, retrain  
  - `/providers` → add/find providers  
  - `/jobs` and `/events` → job lifecycle and tracking  

Feedback (`/query/feedback`) ties user validation back into retraining.

---

## 📐 Architecture Recap

- **Layer 1: Rule-based filtering**  
  - Synonyms + manual heuristics  
  - Provider matching by service + location  

- **Layer 2: ML-powered classification**  
  - Intent model predicts service when rule-based fails  
  - Confidence scores logged for admin oversight  

- **Feedback Loop**  
  - Queries logged in `Query` collection  
  - Admin dashboard approves/rejects predictions  
  - Retraining triggered from dashboard using confirmed logs  

---

#### Built by Kunal Verma  
Founder & Security Lead at Key Systems and Technologies (**KeySysTech**)
