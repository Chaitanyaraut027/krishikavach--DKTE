import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend
dotenv.config({ path: 'c:/Users/hp/Desktop/krishikavach--DKTE/backend/.env' });

const apiKey = process.env.GROK_API_KEY;
console.log('API Key exists:', !!apiKey);

const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1'
});

async function test() {
    try {
        const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say hello' }],
            temperature: 0.3,
            max_tokens: 10,
        });
        console.log('AI Response:', response.choices[0].message.content);
    } catch (err) {
        console.error('AI Error:', err.message);
    }
}

test();
