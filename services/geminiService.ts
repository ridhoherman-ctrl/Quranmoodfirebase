
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { HealingContent, MoodType } from "../types";

const getApiKey = () => {
  try {
    return process.env.API_KEY;
  } catch (e) {
    return undefined;
  }
};

export const generateHealingContent = async (mood: MoodType): Promise<HealingContent> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key is missing. Silakan gunakan tombol 'Atur API Key' untuk memasukkan kunci Gemini Anda.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const uniqueSeed = Math.floor(Math.random() * 1000000);

  const systemInstruction = `
    Anda adalah seorang Ahli Tafsir Al-Quran dan Psikolog Spiritual Islami yang bijaksana.
    TUGAS: Berikan ayat Al-Quran dan Hadist yang paling relevan untuk menenangkan seseorang yang sedang merasa "${mood}".
    BAHASA: Gunakan Bahasa Indonesia yang sangat empati, hangat, dan puitis.
  `;

  const prompt = `Berikan refleksi spiritual untuk suasana hati: ${mood}. Seed: ${uniqueSeed}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING },
            summary: { type: Type.STRING },
            quran: {
              type: Type.OBJECT,
              properties: {
                surahName: { type: Type.STRING },
                surahNumber: { type: Type.INTEGER },
                ayahNumber: { type: Type.INTEGER },
                arabicText: { type: Type.STRING },
                translation: { type: Type.STRING },
                reflection: { type: Type.STRING },
              },
              required: ["surahName", "surahNumber", "ayahNumber", "arabicText", "translation"]
            },
            hadith: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ["source", "text"]
            },
            wisdom: { type: Type.STRING },
            practicalSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            reflectionQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["mood", "summary", "quran", "hadith", "wisdom", "practicalSteps", "reflectionQuestions"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as HealingContent;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, 
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data");
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};
