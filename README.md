# 🚀 HustleHub — AI-Powered Social Learning Platform

HustleHub is a full-stack AI social platform that personalizes learning content and peer discovery.
It combines product-grade engineering with practical ML systems and federated learning simulation.

---

## 🌟 Features

- Personalized feed powered by ML ranking
- Similar-user matching for better peer discovery
- Real-time feedback learning from user interactions
- Federated learning integration using FedAvg simulation
- Scalable backend architecture for production deployment

---

## 🧠 Architecture

HustleHub uses a two-stage recommendation pipeline:

1. Candidate Generation (ANN)
- Retrieves relevant content quickly from a large pool.
- Optimized for low-latency feed serving.

2. Ranking Model
- Re-ranks candidate items using behavioral and contextual signals.
- Produces the final ordered feed shown to users.

Additional learning layers:

- Online learning: interaction feedback updates recommendation signals continuously.
- Federated aggregation: client-like updates are merged with FedAvg-style logic.

---

## 🛠️ Tech Stack

Frontend
- Next.js
- React
- Tailwind CSS

Backend
- FastAPI
- Uvicorn
- Pydantic

ML
- Hybrid recommender (ANN + ranking model)
- Content-based and collaborative filtering signals
- Online feedback adaptation

Database
- MongoDB

Deployment
- Render (backend)
- Vercel (frontend)

---

## ⚡ How It Works

1. User interacts with feed content (watch, like, skip, save).
2. Feedback is sent to backend recommendation endpoints.
3. ML services update features and ranking signals.
4. New recommendations become more personalized over time.

---

## 📊 ML & AI Details

- Hybrid strategy: content-based + collaborative filtering
- Feature engineering: engagement, recency, affinity, session signals
- Ranking signals: candidate score, predicted engagement, freshness, user-item relevance
- Evaluation metrics: Precision@K and Recall@K

---

## 🚀 Setup Instructions

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.\.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd web
npm install
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux

npm run dev
```

Production build:

```bash
npm run build
npm run start
```

---

## 🌐 Deployment

### Backend on Render
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`
- Set production env vars (`MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS`, etc.)

### Frontend on Vercel
- Root directory: `web`
- Framework preset: Next.js
- Set `NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com`
- Deploy

---

## 📸 Screenshots (Placeholder)

### Login
![Login](docs/screenshots/login.png)

### Feed
![Feed](docs/screenshots/feed.png)

### Discover
![Discover](docs/screenshots/discover.png)

---

## 📌 Future Improvements

- Real federated learning clients beyond simulation
- Deep learning ranking and sequential recommendation models
- Graph-based recommendations for social and skill relationships

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make focused, tested changes.
4. Open a clear pull request with impact summary.

---

## 📄 License

MIT License
