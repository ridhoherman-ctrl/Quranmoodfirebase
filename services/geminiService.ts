
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { HealingContent, MoodType } from "../types";

// Helper untuk mendapatkan API Key dengan aman di lingkungan Vite
const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === "undefined" || key === "") {
    console.error("DEBUG: API_KEY tidak ditemukan di environment variables.");
    return null;
  }
  return key;
};

export const generateHealingContent = async (mood: MoodType): Promise<HealingContent> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("Konfigurasi API Key belum terdeteksi. Silakan periksa file .env atau pengaturan environment Anda.");
  }

  // Selalu gunakan inisialisasi baru untuk memastikan key terbaru digunakan
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const uniqueSeed = Math.floor(Math.random() * 999999);

  const systemInstruction = `
    Anda adalah seorang Ahli Tafsir Al-Quran dan Psikolog Spiritual Islami.
    TUGAS: Berikan SATU set refleksi (Ayat, Hadist, Hikmah, Amalan) yang sangat mendalam untuk mood "${mood}".
    
    ATURAN VARIASI:
    - Jelajahi surah-surah yang relevan namun jarang dikutip (bukan hanya Al-Baqarah).
    - Berikan respon dalam Bahasa Indonesia yang sangat menenangkan dan puitis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Berikan refleksi spiritual untuk seseorang yang sedang merasa ${mood}.`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9, 
        seed: uniqueSeed,
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

    if (!response.text) {
      throw new Error("AI tidak mengembalikan teks. Periksa kuota API atau status model.");
    }

    return JSON.parse(response.text) as HealingContent;
  } catch (error: any) {
    console.error("Gemini Error Details:", error);
    
    // Memberikan pesan error yang lebih spesifik jika API Key bermasalah
    if (error.message?.includes("API key not valid")) {
      throw new Error("API Key Gemini tidak valid. Silakan periksa kembali di Google AI Studio.");
    }
    
    throw new Error("Gagal mengambil inspirasi langit. Silakan coba sesaat lagi.");
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Fitur suara tidak tersedia tanpa API Key.");
  
  const ai = new GoogleGenAI({ apiKey: apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Bacakan dengan tenang dan penuh hikmah: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Data suara tidak ditemukan.");
    return base64Audio;
  } catch (error: any) {
    console.error("TTS Error:", error);
    throw new Error("Maaf, suara hikmah sedang tidak tersedia.");
  }
};
