'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

export const getWatchlistSymbolsByEmail = async (email: string): Promise<string[]> => {
  if (!email) return [];
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB is missing");

    // Find user by email in Better Auth's user collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string}>({ email });

    if (!user) return [];

    const userId= (user.id as string) || String(user._id || '');
    if (!userId) return [];

    // Query watchlist by userId and return symbols only
    const items = await Watchlist.find({ userId }, {symbol: 1}).lean();
    return items.map((i) => String(i.symbol));
  } catch (e) {
    console.error('Error in getWatchlistSymbolsByEmail:', e);
    return [];
  }
};
