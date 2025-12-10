'use server';

import { connectToDatabase } from "@/database/mongoose";

export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("MongoDB is missing");

        const users = await db
            .collection('user')
            .find(
                { email: { $exists: true, $ne: null } },
                { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
            )
            .toArray();

        return users
            .filter((user: any) => user.email && user.name)
            .map((user: any) => ({
                id: user.id || user._id?.toString() || '',
                email: user.email as string,
                name: user.name as string,
            }));
    } catch (e) {
        console.log('Error fetching users for news email:', e);
        return [] as { id: string; email: string; name: string }[];
    }
};