# Cliniq

트레이너의 임상기록, 온전히 당신 것으로

A modern clinical record management system for fitness trainers. Cliniq enables trainers to securely manage member profiles, workout templates, and daily progress tracking with an intuitive mobile-first interface.

## Features

- **Trainer Authentication**: Secure email/password authentication for trainers
- **Member Management**: Manage member profiles with PIN-based access
- **Workout Templates**: Create and organize customizable workout templates with exercise library
- **Daily Messages**: Send daily motivational messages and progress updates to members
- **Mobile-First Design**: Responsive interface optimized for all devices
- **Real-time Updates**: Instant synchronization of member data and workouts
- **AI Chat Assistant**: Integrated chat assistant for workout recommendations

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth (Email/Password)
- **Real-time**: Supabase Realtime
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cliniq.git
cd cliniq
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Add your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## Project Structure

```
src/
├── components/        # Reusable UI components
├── pages/            # Page components
├── lib/              # Utility functions and Supabase client
├── App.tsx           # Main app component
└── main.tsx          # Entry point

supabase/
├── migrations/       # Database migrations
└── functions/        # Edge Functions
```

## Database Schema

### Key Tables

- **trainers**: Trainer accounts with authentication
- **members**: Member profiles managed by trainers
- **workouts**: Assigned workouts with exercise details
- **daily_messages**: Daily messages sent to members
- **trainer_members**: Many-to-many relationship between trainers and members

## Authentication Flow

1. **Trainers**: Sign up/login with email and password
2. **Members**: Access member view using 4-digit PIN
3. **Session Management**: Secure token-based authentication

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Support

For issues and feature requests, please create an issue on GitHub.

---

Built with by Cliniq Team
