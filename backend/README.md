# QabrNuma Backend

Express.js API for the QabrNuma Cemetery Management System.

## Prerequisites

- Node.js 18+
- Neon PostgreSQL account (free tier available)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure database

1. Go to [neon.tech](https://neon.tech) and create a free project
2. Copy the connection string from your Neon dashboard
3. Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

4. Update `.env` with your Neon connection string:

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=your-secure-secret-key
PORT=5000
```

### 3. Run database migration

```bash
npm run migrate
```

This will create all tables and insert sample data.

## Running the server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Database Schema

The database includes the following tables:

- **users** - User accounts with roles (admin, staff, cemetery_manager, user)
- **cemeteries** - Cemetery locations and capacity
- **sections** - Cemetery sections/blocks
- **graves** - Individual burial plots
- **death_cases** - Death registration cases
- **burial_records** - Completed burial records
- **reservations** - Plot reservations
- **family_plot_groups** - Family plot groupings
- **family_plot_members** - Members in family plots
- **funeral_services** - Funeral service scheduling
- **case_status_history** - Audit trail for case status changes

## Test Credentials

After running migrations, you can use these test accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@qabrnuma.pk | password123 | admin |
| staff@qabrnuma.pk | password123 | staff |
| manager@qabrnuma.pk | password123 | cemetery_manager |
| user@qabrnuma.pk | password123 | user |
