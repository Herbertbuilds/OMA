// server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// Configuration  of our gemini bot
const API_KEY = process.env.GEMINI_API_KEY; 
const PORT = 3000;
const MODEL_NAME = 'gemini-2.5-flash';

if (!API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY environment variable is not set.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// [UPDATED CODE] model instructions - Added instruction for emojis
const systemInstruction = `You are OMA, the Old Mutual Assistant, a friendly and professional financial companion for Namibians. 
Your purpose is to assist users with their questions about Old Mutual's services, including investments, savings, and insurance. 
Keep your answers concise, helpful, and easy to understand.
**Crucially, use appropriate emojis in your responses to make the conversation more engaging and colorful.**`;


const chat = ai.chats.create({
    model: MODEL_NAME,
    config: {
        systemInstruction: systemInstruction,
    },
});


const app = express();

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: 'Message is required.' });
    }
    
    try {
        const response = await chat.sendMessage({ message: userMessage });
        res.json({ text: response.text });
    } catch (error) {
        console.error('Error sending message to Gemini:', error);
        res.status(500).json({ error: 'Error communicating with the AI model.' });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
    console.log(`API Key set: ${!!API_KEY}`);
});