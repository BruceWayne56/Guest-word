import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { setupSocket } from './socket/index.js';
import { RoomService } from './services/roomService.js';
import { GameService } from './services/gameService.js';
import { WordService } from './services/wordService.js';
import { ZhuyinService } from './services/zhuyinService.js';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: true, // 允許所有來源（開發環境）
  credentials: true,
}));
app.use(express.json());

// Services
const roomService = new RoomService();
const gameService = new GameService();
const wordService = new WordService();
const zhuyinService = new ZhuyinService();

// Connect word validation and zhuyin conversion to game service
gameService.setWordValidator((mainChar, hintChar) => wordService.validateHint(mainChar, hintChar));
gameService.setZhuyinConverter((char) => zhuyinService.charToZhuyin(char));

// Setup Socket.IO
setupSocket(httpServer, roomService, gameService);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Word validation endpoint (for testing)
app.get('/api/validate', (req, res) => {
  const { main, hint } = req.query;
  if (typeof main !== 'string' || typeof hint !== 'string') {
    return res.status(400).json({ error: 'Missing main or hint parameter' });
  }
  const result = wordService.validateHint(main, hint);
  res.json(result);
});

// Zhuyin conversion endpoint (for testing)
app.get('/api/zhuyin', (req, res) => {
  const { char } = req.query;
  if (typeof char !== 'string') {
    return res.status(400).json({ error: 'Missing char parameter' });
  }
  try {
    const zhuyin = zhuyinService.charToZhuyin(char);
    res.json({ char, zhuyin });
  } catch (error) {
    res.status(400).json({ error: 'Conversion failed' });
  }
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Word dictionary loaded: ${wordService.isLoaded() ? 'Yes' : 'No'}`);
});
