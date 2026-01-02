
import { GoogleGenAI } from "@google/genai";

// Fix: Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const analyzeChapterHeader = async (imageFile: File): Promise<string> => {
  try {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(imageFile);
    });

    const base64Data = await base64Promise;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Data,
            },
          },
          {
            text: "This is the first page of a manga chapter. Please extract the chapter title or number if visible. Return only the title/number as a short string. If not found, guess a cool theme name based on the art style. Keep it under 5 words."
          }
        ]
      },
      config: {
        temperature: 0.4,
      }
    });

    return response.text || "New Chapter";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "New Chapter";
  }
};
