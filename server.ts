import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // 1. Health check & internet ping endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), server: 'Bharat Auto Express 5G' });
  });

  // 2. Gemini AI Assistant for In-Game Phone ("Rickshaw Sahayak 5G")
  app.post('/api/ai/ask', async (req, res) => {
    try {
      const { prompt, persona = 'assistant' } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback response with helpful authentic Indian auto driver guidance
        return res.json({
          text: `[5G Rickshaw Sahayak]: "${prompt}" is a great query! Tip: When cruising on NH-48 or Grand Trunk Road, keep 30 PSI in front tire and take a cutting chai break every 50 km! (Connect GEMINI_API_KEY for live neural answers).`,
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      let systemInstruction = 'You are Rickshaw Sahayak 5G, a street-smart, helpful, witty Indian auto-rickshaw AI assistant built into the OPPO F27 5G phone in the game "Bharat Auto Express". Reply in 2-3 concise sentences with authentic Indian warmth, light vernacular phrases (like "Bhai", "Ji bilkul", "Bindass"), and practical driving/local wisdom.';

      if (persona === 'mechanic') {
        systemInstruction = 'You are Ramesh Mistri, a master auto-rickshaw mechanic in Mumbai. Be witty, speak with authentic mechanic slang, and give fun, practical 2-stroke or 4-stroke rickshaw maintenance advice in 2-3 sentences.';
      } else if (persona === 'maa') {
        systemInstruction = 'You are Maa, a caring, loving Indian mother calling your beta driving his auto rickshaw. Always ask if he had food, tell him to drive slowly, and give maternal blessings in 2-3 sentences.';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 220,
        },
      });

      res.json({ text: response.text || 'Network timeout on 5G tower. Try again, Bhai!' });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      res.json({
        text: `5G Signal fluctuating near the highway tunnel! Error: ${err.message || 'Network hiccup'}. Safe driving, Bhai! 🛺`,
      });
    }
  });

  // 3. Vite development middleware or static build production serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bharat Auto Express server running on port ${PORT}`);
  });
}

startServer();
