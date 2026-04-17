import mongoose from 'mongoose';

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
            .then((connection) => {
                console.log('Connected to MongoDB');
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
