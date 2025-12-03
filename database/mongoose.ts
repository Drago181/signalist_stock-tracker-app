import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    } | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async (): Promise<typeof mongoose> => {
    if (!MONGODB_URI) throw new Error('MONGODB_URI must be set within .env');

    if (cached!.conn) return cached!.conn;

    if (!cached!.promise) {
        cached!.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (err) {
        cached!.promise = null as unknown as Promise<typeof mongoose> | null;
        throw err;
    }

    if (process.env.NODE_ENV !== 'production') {
        const { readyState, host, name } = mongoose.connection as unknown as { readyState: number; host?: string; name?: string };
        console.log(`Connected to Database (state=${readyState}) host=${host ?? 'unknown'} db=${name ?? 'unknown'}`);
    }

    return cached!.conn!;
};