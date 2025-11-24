# 🕌 Prayer Tracker App

A comprehensive Islamic prayer tracking application built with React Native (Expo) and Python (FastAPI).

## 📋 Features

- 🕌 Prayer times based on location
- ✅ Track prayer completion
- 📊 Statistics and streaks
- 🧭 Qibla finder
- 📿 Tasbih counter
- 🤲 Duas collection
- 👥 Social features (friends)
- 🌙 Islamic calendar

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL
- Redis (optional)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start Expo development server
npm start
```

### Backend Setup

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # On Mac/Linux
# or
venv\Scripts\activate  # On Windows

# Run the server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## 📱 Development

- Frontend runs on Expo Go app
- Backend runs on `http://localhost:8000`
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
cd backend
source venv/bin/activate
pytest
```

## 📦 Project Structure

See `prayer_app_structure.txt` for detailed structure.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

MIT License
