import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function start(): Promise<void> {
  try {
    await connectDB(env.MONGO_URI);
    app.listen(env.PORT, () => {
      console.log(`Spicebox API running at http://localhost:${env.PORT}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to start server:', message);
    process.exit(1);
  }
}

void start();
