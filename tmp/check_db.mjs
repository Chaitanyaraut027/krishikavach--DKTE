import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/hp/Desktop/krishikavach--DKTE/backend/.env' });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        const count = await mongoose.connection.db.collection('farmprofiles').countDocuments();
        console.log('Total Farm Profiles:', count);
        const profiles = await mongoose.connection.db.collection('farmprofiles').find().toArray();
        console.log('Profiles:', JSON.stringify(profiles, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
