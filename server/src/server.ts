import app from './app.js';
import http from 'http';
import { connectDB } from './db/mongo.js';
import { env } from './config/env.js';

const server = http.createServer(app);
const PORT = env.PORT || 4000;

const start = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

start();
