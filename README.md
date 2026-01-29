# Qurator - Content Curation Platform

A web service for curating and displaying YouTube content across multiple categories.

## Features

- Google OAuth 2.0 Authentication
- Multi-Factor Authentication (MFA)
- 10 Content Categories
- 14 YouTube Videos per Category
- Admin Dashboard for Content Management
- Responsive React Frontend
- FastAPI Backend

## Project Structure

```
qurator/
├── backend/          # FastAPI backend application
└── frontend/         # React frontend application
```

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure your environment variables
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env  # Configure your environment variables
npm start
```

## Environment Variables

See `.env.example` files in both backend and frontend directories.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, PyOTP
- **Frontend**: React, React Router, Axios, TailwindCSS
- **Authentication**: Google OAuth 2.0, MFA with TOTP
