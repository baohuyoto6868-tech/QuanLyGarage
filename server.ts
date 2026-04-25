import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());
  app.use(helmet({
    contentSecurityPolicy: false, // For development and iframe compatibility
  }));
  app.use(morgan('dev'));

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Garage ERP API' });
  });

  // Example API for user logic (if needed beyond Firebase Client SDK)
  app.post('/api/auth/verify', (req, res) => {
    // This could be used for session verification or custom token handling
    res.json({ success: true, message: 'Verified' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
