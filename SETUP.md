# Setup Guide - Anjuman Samaji Behbood

Complete setup guide for both frontend and backend.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or MongoDB Atlas connection string)
- npm or yarn

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment file
```bash
# Copy the example file
cp env.example .env
```

### 4. Configure environment variables
Edit `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/anjuman_charity
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=24h
FRONTEND_URL=http://localhost:5173
```

**Important:** 
- Update `MONGODB_URI` with your MongoDB connection string
- Change `JWT_SECRET` to a strong random string in production

### 5. Seed default users
```bash
npm run seed
```

This will create three default users:
- **Admin**: `admin` / `admin123`
- **Accountant**: `accountant` / `accountant123`
- **Viewer**: `viewer` / `viewer123`

### 6. Start the backend server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create environment file (optional)
If you need to change the API URL, create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

By default, the frontend will use `http://localhost:5000/api`

### 4. Start the frontend development server
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Testing the Authentication

1. Make sure both backend and frontend servers are running
2. Open `http://localhost:5173` in your browser
3. Try logging in with:
   - Username: `admin`
   - Password: `admin123`

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose models
│   │   ├── controllers/     # Route controllers
│   │   ├── routes/          # Express routes
│   │   ├── middlewares/     # Custom middlewares
│   │   ├── utils/           # Utility functions
│   │   └── config/          # Configuration files
│   ├── scripts/            # Seed scripts
│   └── server.js           # Server entry point
│
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   ├── contexts/       # React contexts (Auth)
    │   ├── lib/            # Utilities (API client)
    │   ├── pages/          # Page components
    │   └── types/          # TypeScript types
    └── ...
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify JWT token (protected)

### Health Check
- `GET /health` - Server health check

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env` file
- For MongoDB Atlas, ensure your IP is whitelisted

### CORS Error
- Check `FRONTEND_URL` in backend `.env` matches your frontend URL
- Ensure frontend is running on the correct port

### Authentication Not Working
- Verify backend is running on port 5000
- Check browser console for API errors
- Verify JWT token is being stored in localStorage

### Port Already in Use
- Change `PORT` in backend `.env` file
- Update `VITE_API_BASE_URL` in frontend `.env` accordingly

## Next Steps

After authentication is working:
1. Implement other modules (Donations, Donors, etc.)
2. Add more API endpoints
3. Implement role-based access control on protected routes
4. Add error logging and monitoring
