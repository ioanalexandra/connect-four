import 'dotenv/config';
import http from 'http';
import app from './app';
import { setupSocket } from './socket';

const PORT = process.env.PORT ?? 3000;

const server = http.createServer(app);
setupSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
