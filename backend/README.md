# HustleHub Backend (Production Ready)

FastAPI + MongoDB backend for HustleHub social platform.

## Implemented Features

- JWT authentication with secure password hashing
- User profiles and profile updates
- Video upload pipeline to Cloudinary
- Follow and unfollow users
- Like and unlike videos
- Feed generation:
  - latest videos
  - followed users videos
- Discover users and videos
- Study partner suggestions based on level + shared skills
- Basic API rate limiting
- Input validation with Pydantic

## Tech Stack

- FastAPI (REST API)
- MongoDB (Motor async driver)
- JWT (python-jose)
- Password hashing (passlib + bcrypt)
- Cloudinary (video storage)

## Folder Structure

backend/
- app/
  - config/
  - controllers/
  - middleware/
  - models/
  - routes/
  - schemas/
  - services/
  - utils/
- postman/
- requirements.txt
- run.py
- .env.example

## Environment Setup

1. Create virtual environment and activate:

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Create .env file from .env.example and configure:

- JWT_SECRET
- MONGODB_URI=mongodb://127.0.0.1:27017/hustlehub
- MONGODB_DB_NAME
- CORS_ORIGINS
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

## Run Locally

```powershell
cd backend
python run.py
```

API will run at http://localhost:8000

Swagger docs: http://localhost:8000/docs

## Main Endpoints

### Auth

- POST /api/v1/auth/register
- POST /api/v1/auth/login

### User

- GET /api/v1/user/{user_id}
- PATCH /api/v1/user/me
- GET /api/v1/user/suggestions
- POST /api/v1/user/follow

### Video

- POST /api/v1/video/upload
- GET /api/v1/video/feed?mode=latest|following
- POST /api/v1/video/like

### Discover

- GET /api/v1/discover/users
- GET /api/v1/discover/videos
- GET /api/v1/discover/study-partners

## Database Collections

### users

- _id
- name
- username
- email
- phone
- password_hash
- bio
- skills[]
- profile_picture
- level
- followers_count
- following_count
- activity_score
- created_at
- updated_at

### videos

- _id
- user_id
- video_url
- caption
- tags[]
- likes_count
- comments_count
- created_at
- updated_at

### follows

- _id
- follower_id
- following_id
- created_at

### likes

- _id
- user_id
- video_id
- created_at

## Security

- Password hashing with bcrypt
- JWT bearer authentication
- Request payload validation
- Basic endpoint rate limits
- Database indexes for performance and uniqueness

## Postman

Import collection:

- backend/postman/HustleHub.postman_collection.json

Set variables:

- base_url = http://localhost:8000
- token = access token from login/register