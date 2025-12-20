# Keazy Service Discovery Platform (Prototype)

Keazy is a voice-enabled service discovery platform for Tier 2/3 Indian cities.  
This repo contains the **backend + ML microservice** setup that powers intent classification, logging, and retraining.

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
```
git clone https://github.com/<your-username>/Keazy_Server.git
cd Keazy_Server
```

**Note: It is mandatory to create branches from Dev branch, only final Dev can merge to main, rest all work and releases originate and merge to Dev branch.**

### 2. Backend (Node.js)
```
cd keazy-backend
npm install
```

### 3. ML Microservice (Python + Flask)
```
cd ml-service
pip install -r requirements.txt
```

---

## 🚀 Running the System

### 1. Start MongoDB
Make sure MongoDB is running locally
```
net start MongoDB
```

### 2. Train the ML Model
Run the training script to generate intent_model.pkl and vectorizer.pkl:
```
python train_model.py
```

Outputs:
- intent_model.pkl
- vectorizer.pkl
- Classification report (printed in console)

### 3. Start Flask Microservice
```
cd ml-service
python app.py
```

Flask will start on:
http://127.0.0.1:5000/predict

### 4. Start Node Backend
```
cd keazy-backend
npm run seed   # auto-restart with nodemon
npm run dev
```

---

Backend will start on:
- http://127.0.0.1:3000/classify


Now you can import keazy-backend\postman\Keazy.postman_collection.json to test.

---

#### Built by Kunal Verma
Co-Founder & CEO at Key Systems and Technologies(**KeySysTech**).
