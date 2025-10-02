import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';

dotenv.config();

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback_secret_key';
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/atlas_ai';

// Session timeout configurations
export const SESSION_ABSOLUTE_TIMEOUT = parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT || '86400000'); // 24 hours default
export const SESSION_IDLE_TIMEOUT = parseInt(process.env.SESSION_IDLE_TIMEOUT || '1800000'); // 30 minutes default
export const sessionConfig = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: DATABASE_URL,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: SESSION_ABSOLUTE_TIMEOUT
  },
  name: 'atlas.session'
});