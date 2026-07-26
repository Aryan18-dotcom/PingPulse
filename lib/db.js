import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in Environment Variables');
}

let cached = global.mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((m) => m);
  }

  cached.conn = await cached.promise;

  // 🔄 Local Dev Auto-Pinger (Executes ONLY during local development)
  if (process.env.NODE_ENV === 'development' && !global.devPingLoop) {
    global.devPingLoop = true;
    console.log('⚡ [Local Dev] Starting background auto-ping loop (Every 1 minute)...');

    setInterval(async () => {
      try {
        await fetch('http://localhost:3000/api/cron/ping', {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        });
      } catch (e) {
        // Server restarting or compilation in progress
      }
    }, 60000);
  }

  return cached.conn;
}