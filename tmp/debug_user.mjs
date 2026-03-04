import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/hp/Desktop/krishikavach--DKTE/backend/.env' });

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await mongoose.connection.db.collection('users').find({ name: /Shruti/i }).toArray();
        console.log('Users found:', users.map(u => ({ id: u._id, name: u.name })));

        if (users.length > 0) {
            const profiles = await mongoose.connection.db.collection('farmprofiles').find({ user: users[0]._id }).toArray();
            console.log('Farm Profile for Shruti:', JSON.stringify(profiles, null, 2));
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
run();
