const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const chatRoutes = require('./src/routes/chat.routes');
const documentRoutes = require('./src/routes/document.routes');
const aiChatRoutes = require('./src/routes/ai-chat.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const settingsRoutes = require('./src/routes/settings.routes');
const errorMiddleware = require('./src/middlewares/error.middleware');

// Security & Audit Middleware Imports
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);

// Determine the allowed origin based on the environment
const allowedOrigin = process.env.ENVIRONMENT === 'prod' 
  ? "https://neuro-desk-steel.vercel.app" 
  : "http://localhost:3000";


  
const corsOptions = {
  origin: allowedOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

// Middleware
app.use(express.json({ limit: '10kb' })); // Body limit is 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(cors(corsOptions));

// Security & Polish Middlewares
app.use(helmet()); // Set specific HTTP headers

// Prevent NoSQL Injections safely in Express 5 (req.query is read-only)
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body, { replaceWith: '_' });
  if (req.params) req.params = mongoSanitize.sanitize(req.params, { replaceWith: '_' });
  if (req.query) {
    const sanitizedQuery = mongoSanitize.sanitize(req.query, { replaceWith: '_' });
    for (const key in req.query) delete req.query[key];
    Object.assign(req.query, sanitizedQuery);
  }
  next();
});
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // API hitting logs in dev
} else {
  app.use(morgan('combined')); // Strict auditing in prod
}

// Global API Rate Limiting (Prevent Brute forcing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', 
  legacyHeaders: false, 
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', limiter);

// Make io accessible in request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => {
  res.send('NeuroDesk API is running with Socket.io...');
});

// Error Middleware
app.use(errorMiddleware);

// Socket logic
require('./src/services/socket.service')(io);

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not defined in .env file');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
