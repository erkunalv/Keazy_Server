# Keazy Service Discovery Platform

Keazy is a voice-enabled service discovery platform for Tier 2/3 Indian cities with human-in-the-loop ML model improvement. This repository contains the backend, ML microservice, and admin frontend.

## 📂 Project Structure

- **keazy-backend** → Node.js + Express backend  
  - Modular routes (admin, providers, services, etc.)  
  - Models (User, Provider, Service, Slot, Query, RetrainHistory, Job, Event)  
  - Two-layer architecture: rule-based filtering, then ML fallback  
  - Integrated feedback loop for retraining  

- **ml-service** → Python + Flask microservice  
  - Trains and serves intent classification model  
  - Exposes `/predict` and `/retrain` endpoints  
  - Generates `intent_model.pkl` and `vectorizer.pkl`  

- **keazy-admin** → React + Material-UI admin dashboard  
  - Admin CRUD for services, slots, users  
  - Query logs viewer with correction workflow  
  - Model retraining dashboard  
  - Metrics and human-in-the-loop validation  

- **docker-compose.yml** → Containerized orchestration

## 📦 Prerequisites

- Docker + Docker Compose  
- Node.js (>= 18.x) for local backend dev  
- Python (>= 3.10) for local ML service dev  
- MongoDB  
- Git, Postman (optional)

## 🛠️ Installation

### Clone the repository
```bash
git clone https://github.com/<your-username>/Keazy_Server.git
cd Keazy_Server
```

### Start services with Docker
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

#### Feedback Loop
- Queries logged in Query collection
- Admin dashboard approves/rejects predictions
- Users can mark predictions as wrong and suggest corrections
- Corrections and approved logs used in retraining
- Retraining triggered from dashboard

---

## ✨ Retrain & Correction Workflows

### User Workflows

#### Mark a Prediction as Wrong & Correct It
1. Navigate to **Dashboard → Query Logs**
2. Find a query with wrong prediction
3. Click the **✗ Wrong** button
4. Select correct service from dropdown
5. Click **Save Correction**
6. Correction saved to MongoDB ✅

#### Trigger Model Retrain
1. Navigate to **Dashboard → 🤖 Model Retrain**
2. Click **Trigger Retrain** button
3. Confirm in dialog
4. System automatically:
   - Fetches approved logs
   - Fetches user corrections
   - Merges datasets
   - Trains new model
   - Saves artifacts
5. See success notification ✅

### What Was Implemented

**Backend (keazy-backend/routes/dashboard.js):**
- `POST /dashboard/corrections` - Save correction to MongoDB
- `GET /dashboard/corrections` - Fetch corrections for training

**Frontend (keazy-admin/src/pages/):**
- `QueryLogsPage.jsx` - Add ✓/✗ buttons and correction dialog
- `RetrainPage.jsx` - Dashboard for triggering retrains and viewing history

**ML Pipeline (ml-service/train_model.py):**
- Fetches approved logs from `query_logs` collection
- Fetches corrections from `corrections` collection
- Merges both datasets
- Trains model on combined data

**Navigation:**
- Added `/retrain` route in App.jsx
- Added "🤖 Model Retrain" menu item in DashboardLayout.jsx

### Data Flow

```
User marks prediction as WRONG
    ↓
Opens correction dialog → selects correct service
    ↓
POST /dashboard/corrections
    ↓
Correction saved to MongoDB.corrections collection
Also updates Query document with corrected_service
    ↓
User triggers retrain via RetrainPage
    ↓
POST /dashboard/retrain
    ↓
train_model.py executes:
  1. Fetches approved logs (approved_for_training: true)
  2. Fetches corrections from corrections collection
  3. Merges both datasets
  4. Trains new ML model
  5. Saves model artifacts
    ↓
Frontend shows success & auto-refreshes history
    ↓
Next predictions use improved model
```

### API Endpoints

**Save Correction:**
```http
POST /dashboard/corrections
Content-Type: application/json

{
  "query_id": "507f1f77bcf86cd799439011",
  "query_text": "cancel my reservation",
  "original_service": "booking",
  "corrected_service": "cancellation",
  "confidence": 0.72,
  "timestamp": "2026-01-02T10:30:00Z"
}
```

**Fetch Corrections:**
```http
GET /dashboard/corrections
```

### Database Schema

**corrections Collection:**
```javascript
{
  _id: ObjectId,
  query_id: String,
  query_text: String,
  original_service: String,
  corrected_service: String,
  confidence: Number,
  timestamp: Date,
  created_at: Date,
  updated_at: Date
}
```

**query_logs Collection (Updated):**
```javascript
{
  _id: ObjectId,
  query_text: String,
  corrected_service: String,  // NEW: Set by correction
  corrected_at: Date,         // NEW: When corrected
  ...
}
```

### Testing

**Run Corrections Integration Test:**
```bash
cd d:\Business\KeySystech\Project_3
python test_corrections_logic.py
```

**Expected Results:**
```
✅ 3 approved logs + 2 corrections merged
✅ Model trained on 5 combined samples
✅ Service predictions working
✅ All tests passed
```

### Implementation Statistics

- 6 Files Created
- 11 Files Modified
- 5,255 Lines Added
- 406 Lines Deleted
- 100% Tests Passing ✅

---

### Built by Kunal Verma
Founder at Key Systems and Technologies (KeySysTech)