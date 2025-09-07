# Pilgrim AI Agent - Ujjain Yatra Guide

An intelligent AI-powered pilgrimage assistant for Ujjain that helps pilgrims with temple information, lost & found services, customized itineraries, and real-time guidance.

## Prerequisites

- **Docker** and **Docker Compose** installed on your system
- **API credentials** (provided separately)

## Quick Start

### Step 1: Environment Configuration

Create a `.env` file in the root directory by copying from the example:

```bash
cp .env.example .env
```

Then update the `.env` file with your provided API credentials (get the actual keys from the external README provided to you):

```env
NEXT_PUBLIC_API_BASE=your_api_base_url_here
NEXT_PUBLIC_API_KEY=your_api_key_here
```

> ⚠️ **Important:** Get the actual API credentials from the separate README file provided to you

### Step 2: Start the Application

```bash
docker-compose up -d
```

### Step 3: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## How to Use

### Getting Started
1. On the homepage, click the **"Yatra Shuru Karein"** button
2. You'll be redirected to the Sarathi (Guide) page
3. A popup will appear - click **"Enable Audio"** to grant microphone access for voice interaction
4. Start conversing with your AI pilgrimage assistant!

### To Use Video Mode
1. Click on the **Video icon** - the camera will start
2. Now you can ask questions from the dataset provided
3. The AI will respond to your visual queries along with audio

## Alternative Setup (Without Docker Compose)

If you prefer to run without Docker Compose:

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
  -e NEXT_PUBLIC_API_BASE=your_actual_api_base_here \
  divyadarshak
```

## Development Mode (Without Docker)

For local development:

### 1. Navigate to Frontend
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_BASE=your_api_base_url_here
NEXT_PUBLIC_API_KEY=your_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_BASE` | Backend API URL | Yes |
| `NEXT_PUBLIC_API_KEY` | API authentication key | Yes |

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Stop the current container
docker-compose down
# Use a different port (edit docker-compose.yml)
# Change "3000:3000" to "3001:3000"
```

**Docker Build Fails:**
- Ensure Docker daemon is running
- Check available disk space
- Try cleaning Docker cache: `docker system prune`

**API Connection Issues:**
- Verify your API credentials in `.env` file
- Ensure good internet connectivity
- Check that the API service is accessible

**Application Not Loading:**
- Check container status: `docker-compose ps`
- View logs: `docker-compose logs`
- Restart services: `docker-compose restart`

### Audio Not Working
1. Check browser microphone permissions
2. Ensure microphone is not being used by other applications
3. Try refreshing the page and re-enabling audio

### Logs and Debugging
```bash
# View application logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---
