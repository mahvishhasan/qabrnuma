# Qabar Numa - Cemetery Management System

A comprehensive cemetery management system for managing graves, reservations, burial records, and funeral services. Built for Lahore, Pakistan with real cemetery data.

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Heroicons

**Backend:**
- Node.js / Express.js
- PostgreSQL
- JWT Authentication
- bcrypt password hashing

## Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/qabrnuma.git
cd qabrnuma
```

### 2. Setup the database
```bash
# Create PostgreSQL database
createdb qabrnuma

# Run schema and seed data
psql -d qabrnuma -f backend/src/config/schema.sql
psql -d qabrnuma -f backend/src/config/seed.sql
```

### 3. Configure environment variables

**Backend** (`backend/.env`):
```env
PORT=5001
DATABASE_URL=postgresql://username:password@localhost:5432/qabrnuma
JWT_SECRET=your-secure-jwt-secret-key
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### 4. Install dependencies and start servers

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api

## Demo Users

All demo users have the password: `Demo1234!`

| Role | Email | Description |
|------|-------|-------------|
| Admin | admin@qabar.pk | Full system access |
| Cemetery Manager | manager@qabar.pk | Manages cemeteries and sections |
| Coordinator | coordinator@qabar.pk | Handles death cases and schedules services |
| Staff | staff@qabar.pk | Executes assigned funeral services |
| User | family@qabar.pk | Family member making reservations |

## Deployment

### Vercel Deployment

Both frontend and backend are configured for Vercel deployment.

**Backend:**
1. Create a new Vercel project from the `backend` directory
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secure secret key
   - `FRONTEND_URL` - Deployed frontend URL

**Frontend:**
1. Create a new Vercel project from the `frontend` directory
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL` - Deployed backend API URL

### Database Setup (Production)

Use a managed PostgreSQL service (Supabase, Neon, Railway, etc.):
1. Create a new PostgreSQL database
2. Run `schema.sql` to create tables
3. Run `seed.sql` to populate demo data

## Project Structure

```
qabrnuma/
├── backend/
│   ├── src/
│   │   ├── config/         # Database schema and seed data
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   └── index.js        # Express app entry
│   ├── vercel.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context (Auth)
│   │   ├── lib/           # API client
│   │   └── types/         # TypeScript types
│   ├── vercel.json
│   └── package.json
│
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User authentication |
| POST | /api/auth/register | User registration |
| GET | /api/cemeteries | List all cemeteries |
| GET | /api/graves | List grave plots |
| GET | /api/death-cases | List death cases |
| GET | /api/burial-records | List burial records |
| GET | /api/reservations | List reservations |
| GET | /api/funeral-services | List funeral services |

## License

MIT
