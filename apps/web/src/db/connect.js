import mongoose from 'mongoose';

import UserAccount from './models/UserAccount.js';

let connectionPromise = null;

const connectDB = async (uri) => {
    if (!uri) {
        throw new Error('MONGO_URI is missing. Add it to your .env file.');
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!connectionPromise) {
        connectionPromise = mongoose
            .connect(uri, {
                dbName: 'blockchain_weblearning',
            })
            .then(async (connection) => {
                console.log('Connected to MongoDB');
                // Drops DB indexes that are not in the schema (e.g. legacy unique
                // `email` when accounts are wallet-only), fixing E11000 on email: null.
                await UserAccount.syncIndexes();
                return connection;
            })
            .catch((error) => {
                connectionPromise = null;
                throw error;
            });
    }

    return connectionPromise;
};

export default connectDB;
