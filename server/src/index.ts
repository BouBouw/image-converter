import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import convertRoutes from './routes/convert';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

app.use('/api', convertRoutes);

// Log all routes
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    console.log('Registered route:', middleware.route.path);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        console.log('Registered route:', handler.route.path);
      }
    });
  }
});

const PORT = process.env.PORT || 3001;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
