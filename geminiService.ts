
import { GoogleGenAI, Type } from "@google/genai";
import { GradingResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeEssay = async (imageBase64: string): Promise<GradingResult> => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are an expert IELTS Academic Writing examiner. 
    Analyze the provided image of a handwritten essay. 
    1. Perform OCR to extract the text.
    2. Grade the essay based on official IELTS Academic Task criteria (0-9).
    3. Provide an overall band score.
    4. Provide individual scores for: Task Response, Coherence and Cohesion, Lexical Resource, Grammar Range and Accuracy.
    5. Provide structured, professional, and friendly feedback. 
       Identify specific points of interest and for each, provide:
       - The original text (the mistake or area for improvement).
       - An explanation of why it needs changing or why it is a mistake.
       - A specific suggestion for a better alternative.
       - Categorize the feedback by type (grammar, vocabulary, etc.) and severity (mistake, suggestion, praise).
    Return the response strictly as JSON.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      overallBand: { type: Type.NUMBER },
      criteria: {
        type: Type.OBJECT,
        properties: {
          taskResponse: { type: Type.NUMBER },
          coherenceCohesion: { type: Type.NUMBER },
          lexicalResource: { type: Type.NUMBER },
          grammarAccuracy: { type: Type.NUMBER }
        },
        required: ["taskResponse", "coherenceCohesion", "lexicalResource", "grammarAccuracy"]
      },
      detailedFeedback: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['grammar', 'vocabulary', 'structure', 'task-response'] },
            severity: { type: Type.STRING, enum: ['mistake', 'suggestion', 'praise'] },
            originalText: { type: Type.STRING },
            explanation: { type: Type.STRING },
            suggestion: { type: Type.STRING }
          },
          required: ["type", "severity", "explanation"]
        }
      },
      summary: { type: Type.STRING },
      essayText: { type: Type.STRING }
    },
    required: ["overallBand", "criteria", "detailedFeedback", "summary", "essayText"]
  };

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        { text: "Grade this IELTS Academic Writing essay and provide structured feedback." }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    throw new Error("Failed to parse grading results.");
  }
};
