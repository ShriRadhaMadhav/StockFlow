import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import { sendSuccess, sendError } from '../utils/response';
import fs from 'fs';

// Lazy initialization
let genAI: GoogleGenerativeAI;
const getGenAI = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return genAI;
};

let groq: Groq;
const getGroq = () => {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }
  return groq;
};

// Models to try in order
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
];

const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const OCR_PROMPT = `
You are an expert OCR and data extraction system for a billing and inventory application.
Analyze this image of a vendor bill or invoice.
Extract the following information and output it EXACTLY as a valid JSON object without any markdown wrapping (no \`\`\`json) or extra text:
{
  "vendorName": "extracted name or empty string if not found",
  "invoiceNumber": "extracted invoice number or empty string",
  "date": "extracted date or empty string",
  "totalAmount": numeric value or 0,
  "items": [
    {
      "name": "product name",
      "quantity": numeric value or 0,
      "unitPrice": numeric value or 0
    }
  ]
}
`;

async function callGemini(base64Data: string, mimeType: string): Promise<string> {
  const imageParts = [{ inlineData: { data: base64Data, mimeType } }];
  
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[OCR] Trying Gemini model: ${modelName}`);
      const model = getGenAI().getGenerativeModel({ model: modelName });
      const result = await model.generateContent([OCR_PROMPT, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      console.log(`[OCR] Success with Gemini model: ${modelName}`);
      return text;
    } catch (err: any) {
      const status = err?.status || err?.httpStatusCode || '';
      console.warn(`[OCR] Gemini ${modelName} failed (${status}): ${err.message}`);
      // Continue loop only for rate limits or server errors
      if (status !== 503 && status !== 429) {
        throw err; 
      }
    }
  }
  throw new Error('All Gemini models failed due to high traffic.');
}

async function callGroqFallback(base64Data: string, mimeType: string): Promise<string> {
  console.log(`[OCR] Falling back to Groq model: ${GROQ_MODEL}`);
  const groqClient = getGroq();
  
  const completion = await groqClient.chat.completions.create({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: OCR_PROMPT },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Data}`,
            },
          },
        ],
      },
    ],
    model: GROQ_MODEL,
    temperature: 0.1,
  });

  const text = completion.choices[0]?.message?.content || "";
  console.log(`[OCR] Success with Groq model: ${GROQ_MODEL}`);
  return text;
}

export const processBillImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No image file provided.');
    }

    const mimeType = req.file.mimetype;
    const base64Data = fs.readFileSync(req.file.path).toString("base64");

    let text = "";
    try {
      // 1. Try Gemini first
      text = await callGemini(base64Data, mimeType);
    } catch (geminiError: any) {
      console.warn(`[OCR] Gemini flow failed completely: ${geminiError.message}`);
      // 2. Fallback to Groq if Gemini fails
      try {
        text = await callGroqFallback(base64Data, mimeType);
      } catch (groqError: any) {
        console.error(`[OCR] Groq flow also failed: ${groqError.message}`);
        throw new Error('Both primary AI and fallback AI are currently unavailable. Please try again later.');
      }
    }

    // Try to parse the JSON string from the response
    let parsedData;
    try {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanText);
    } catch (e) {
      console.error("[OCR] Failed to parse AI output as JSON:", text);
      return sendError(res, 500, 'Failed to extract structured data from image.');
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    return sendSuccess(res, 200, 'Bill processed successfully', parsedData);

  } catch (error: any) {
    console.error('[OCR] Processing Error:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return sendError(res, 500, error.message || 'Error processing bill image.');
  }
};
