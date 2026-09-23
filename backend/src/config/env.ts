import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/schedura',
  JWT_SECRET: process.env.JWT_SECRET || 'schedura_jwt_secure_super_secret_key_2026_ps63',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
