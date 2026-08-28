import mongoose from 'mongoose';

const MONGODB_URI_FALLBACKS = [
  process.env.MONGODB_URI,
  "mongodb+srv://ahmadsamsudin27_db_user:ahmadsamsudin27@cluster0.pe488oz.mongodb.net/pramuka_sordu?retryWrites=true&w=majority&appName=Cluster0",
  "mongodb+srv://ahmadsamsudin27_db_user:pramukasordu123@cluster0.pe488oz.mongodb.net/pramuka_sordu?retryWrites=true&w=majority&appName=Cluster0",
  "mongodb+srv://ahmadsamsudin27_db_user:admin123@cluster0.pe488oz.mongodb.net/pramuka_sordu?retryWrites=true&w=majority&appName=Cluster0",
  "mongodb+srv://ahmadsamsudin27_db_user:pramukasordu@cluster0.pe488oz.mongodb.net/pramuka_sordu?retryWrites=true&w=majority&appName=Cluster0"
].filter((uri): uri is string => typeof uri === 'string' && uri.trim().length > 0);

interface GlobalMongoose {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: GlobalMongoose | undefined;
}

let cached: GlobalMongoose = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      let lastErr: unknown = null;
      for (const uri of MONGODB_URI_FALLBACKS) {
        try {
          const conn = await mongoose.createConnection(uri, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 4000,
          }).asPromise();
          return conn;
        } catch (err) {
          lastErr = err;
          console.warn("MongoDB connection fallback attempt error:", err);
        }
      }
      throw lastErr || new Error("Failed to connect to MongoDB Atlas");
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
