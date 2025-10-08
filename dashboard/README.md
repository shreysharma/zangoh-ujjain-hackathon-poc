# Sanrakshak - Dashboard

Smart Pilgrimage Management Dashboard for Security Personnel

## Features

- 🔐 Secure chat interface with input validation and sanitization
- 📊 Real-time operational insights
- 🔍 Lost & Found case management
- 👥 Crowd flow analytics
- 🚨 Security alerts and notifications
- 📱 Responsive design

## Security Features

- XSS protection with input sanitization
- Input validation on all forms
- Security headers (X-Frame-Options, CSP, etc.)
- Error boundaries for graceful error handling
- Secure localStorage handling with try-catch

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local and add your API key (see API Setup below)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### API Setup (Required)

The dashboard requires a backend API key to function.

1. **Get API Key**: Contact your backend administrator
2. **Configure**: Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_API_KEY=your_api_key_here
   ```
3. **Restart**: Restart the dev server

📚 **See [API_SETUP.md](./API_SETUP.md) for detailed setup instructions**

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build Docker image
docker build -t sanrakshak-dashboard .

# Run container
docker run -p 3000:3000 sanrakshak-dashboard
```

## Project Structure

```
dashboard/
├── app/                    # Next.js app directory
│   ├── chat/[id]/         # Dynamic chat pages
│   ├── page.tsx           # Home page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── ui/               # UI components
│   └── error-boundary.tsx # Error boundary
├── lib/                  # Utility functions
│   └── utils.ts          # Helper functions
└── public/               # Static assets
```

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Fonts**: General Sans, Switzer
- **Icons**: Lucide React

## Environment Variables

Required environment variables in `.env.local`:

```env
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=https://divyadarshak-dev-us-central1-backend-api-719591289817.us-central1.run.app

# API Key (REQUIRED)
NEXT_PUBLIC_API_KEY=your_api_key_here

# Authentication
NEXT_PUBLIC_AUTH_ENABLED=true

# Polling intervals (optional)
NEXT_PUBLIC_QUERY_POLL_INTERVAL=1000
NEXT_PUBLIC_EMAIL_POLL_INTERVAL=2000
```

See [API_SETUP.md](./API_SETUP.md) for detailed configuration instructions.

## Contributing

1. Follow TypeScript best practices
2. Run linting before committing
3. Write tests for new features
4. Ensure all security checks pass

## License

Proprietary - Zangoh
