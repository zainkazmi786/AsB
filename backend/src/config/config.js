import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/anjuman_charity',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiry: process.env.JWT_EXPIRY || '24h',
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  },
};
