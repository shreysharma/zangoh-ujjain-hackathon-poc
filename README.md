# 🏛️ Divyadarshak - Ujjain Hackathon POC

## 🎯 Overview

Divyadarshak is a proof-of-concept application developed for the Ujjain Hackathon. This project demonstrates a modern web application with a containerized frontend.

## ✅ Prerequisites

- **Docker** installed on your system
- **API Key** for authentication

## 🚀 Quick Start

### Step 1: Environment Configuration

Create a `.env` file in the `frontend` directory with your API credentials:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_API_KEY=your_actual_api_key_here
```

> ⚠️ **Important:** Replace `your_actual_api_key_here` with your actual API key

## 🐳 Running with Docker

Execute the following commands from the project root directory:

### 1. Navigate to Frontend
```bash
cd frontend
```

### 2. Build Docker Image
```bash
docker build -t divyadarshak .
```

### 3. Run Docker Container
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_KEY=your_actual_api_key_here \
  -e NEXT_PUBLIC_API_BASE=http://localhost:8000 \
  divyadarshak
```

> 📝 **Note:** Make sure to replace `your_actual_api_key_here` with your real API key in the command above

## 🌐 Accessing the Application

Once the container is running, open your browser and navigate to:

```
http://localhost:3000
```

## 💻 Development Mode (Without Docker)

For local development without Docker, run the following commands:

### 1. Navigate to Frontend
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

The development server will start on `http://localhost:3000` with hot-reload enabled.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_API_KEY` | Your API authentication key | Your actual key |

## 🔧 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Use a different port
docker run -p 3001:3000 ... 
```

**Docker Build Fails:**
- Ensure Docker daemon is running
- Check available disk space
- Try cleaning Docker cache: `docker system prune`

**API Connection Issues:**
- Verify your API key is correct
- Ensure the backend service is accessible
- Check network connectivity

---
