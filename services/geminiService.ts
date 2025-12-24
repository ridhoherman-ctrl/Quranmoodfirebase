
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { HealingContent, MoodType } from "../types";

export const generateHealingContent = async (mood: MoodType): Promise<HealingContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please use the 'Set API Key' button to configure your access.");
  }

  // Create instance right before call as per instructions
  const ai = new GoogleGenAI({ apiKey });

  const uniqueSeed = Math.floor(Math.random() * 1000000);
  const timestamp = new Date().toISOString();

  const systemInstruction = `
    Anda adalah seorang Ahli Tafsir Al-Quran, Pakar Hadits, dan Psikolog Spiritual Islami yang sangat bijaksana.
    
    PRINSIP KERJA:
    1. VARIASI TINGGI: Untuk mood "${mood}", pilih satu ayat Al-Quran secara acak yang unik dari 20+ ayat relevan.
    2. KORELASI TERKUNCI (CONTEXT LOCK): Seluruh konten (Hadist, Hikmah, Amalan, Refleksi) HARUS merujuk langsung pada pesan spesifik dari ayat tersebut.
    3. Bahasa: Hangat, empatik, dan menenangkan.
  `;

  const prompt = `
    Mood Pengguna: "${mood}"
    Random Seed: ${uniqueSeed}
    Waktu: ${timestamp}

    TUGAS: Pilih ayat penenang yang relevan, cari hadist yang senada, dan susun hikmah serta amalan praktis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 1.0,
        topP: 0.95,
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
              required: ["surahName", "surahNumber", "ayahNumber", "arabicText", "translation", "reflection"]
            },
            hadith: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                text: { type: Type.STRING },
                reflection: { type: Type.STRING },
              },
              required: ["source", "text", "reflection"]
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
    throw new Error("Maaf, sedang ada kendala teknis saat menghubungi server AI. Silakan coba lagi.");
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
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
    if (!base64Audio) throw new Error("No audio data returned");
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw new Error("Gagal menghasilkan suara.");
  }
};
