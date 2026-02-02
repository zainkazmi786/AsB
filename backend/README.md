# Backend API - Anjuman Samaji Behbood

Backend API for the Charity Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- Set `MONGODB_URI` to your MongoDB connection string
- Set `JWT_SECRET` to a strong secret key
- Set `FRONTEND_URL` to your frontend URL

4. Seed default users:
```bash
npm run seed
```

5. Start the server:
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## Default Users

After running the seed script, you can login with:

- **Admin**: `admin` / `admin123`
- **Accountant**: `accountant` / `accountant123`
- **Viewer**: `viewer` / `viewer123`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify token (protected)

### Health Check

- `GET /health` - Server health check

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRY` - JWT expiration time (default: 24h)
- `FRONTEND_URL` - Frontend URL for CORS
