import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Route: OCR Biometric Punch Sheet / Image / PDF
  app.post('/api/ocr-biometric', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          success: false,
          fallbackNeeded: true,
          message: 'GEMINI_API_KEY is not configured on the server. Falling back to pre-parsed dataset and smart local OCR parser.'
        });
      }

      const ai = new GoogleGenAI();
      const prompt = `You are a high-accuracy OCR assistant for biometric fingerprint machine attendance logs.
Extract every row in this attendance report image or PDF.
The columns are: Department, Name, No., Date/Time, Status, Location ID, Workcode, VerifyCode.
Output a JSON array of objects where each object has:
- "name": string (employee name as shown, e.g. "Md. Habibi", "Murshida A", "Md. Belal H", "Rayhan", "Farhana", "A.K.M. Mis", "Fabiha Mu")
- "machineNo": string (the enroll number in No. column, e.g. "2", "3", "4", "10", "19", "25", "27")
- "dateTime": string (exact date and time, e.g. "01/09/2026 09:56:58" or "05/09/2026 20:12:28")
- "status": string (e.g. "C/In")
- "verifyCode": string (e.g. "FP")
Return ONLY the JSON array without markdown formatting.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/png',
                  data: imageBase64.replace(/^data:[^;]+;base64,/, '')
                }
              }
            ]
          }
        ]
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const rows = JSON.parse(jsonMatch[0]);
          return res.json({ success: true, rows });
        } catch {}
      }

      return res.json({ success: true, rawText: responseText });
    } catch (error: any) {
      console.error('OCR API Error:', error);
      return res.status(500).json({ error: error.message || 'OCR extraction failed' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // In development, hook up Vite dev server middlewares
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: 'dist' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
