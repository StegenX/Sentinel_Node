import mongoose from "mongoose";

export const connectToDatabase = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/sentinel');
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
};