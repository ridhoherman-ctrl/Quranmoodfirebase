
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { HealingContent, MoodType } from "../types";

export const generateHealingContent = async (mood: MoodType): Promise<HealingContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Sistem sedang menyiapkan koneksi. Mohon tunggu sebentar.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const uniqueSeed = Math.floor(Math.random() * 999999);
  // Random nonce to break AI's tendency to repeat common answers
  const randomNonce = btoa(Math.random().toString()).substring(0, 8);

  const systemInstruction = `
    Anda adalah seorang Ahli Tafsir Al-Quran dan Psikolog Spiritual Islami.
    TUGAS: Berikan SATU set refleksi (Ayat, Hadist, Hikmah, Amalan) yang sangat mendalam untuk mood "${mood}".
    
    ATURAN VARIASI (PENTING):
    - Gunakan pengacak internal dengan ID: ${uniqueSeed}-${randomNonce}.
    - JANGAN memberikan ayat yang sama jika dipicu ulang. Jelajahi surah-surah yang jarang dikutip namun sangat relevan (seperti Al-Anbiya, Fatir, Az-Zumar, Ar-Ra'd, dll).
    - Hindari memberikan Al-Baqarah 153 atau 155 kecuali benar-benar sangat diperlukan.
    - Pastikan ayat yang dipilih benar-benar spesifik menyentuh akar perasaan ${mood}.
    
    ATURAN RELEVANSI:
    - Hadist, Hikmah, Amalan, dan Renungan Hati HARUS merujuk langsung pada pesan spesifik ayat yang Anda pilih. 
    - Semuanya harus membentuk satu kesatuan tema yang utuh.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Berikan refleksi spiritual untuk mood ${mood}. [Request ID: ${randomNonce}]`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 1.0, 
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
            practicalSteps: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 3 },
            reflectionQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 2 }
          },
          required: ["mood", "summary", "quran", "hadith", "wisdom", "practicalSteps", "reflectionQuestions"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as HealingContent;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("Maaf, hati sedang sulit dijangkau. Coba tekan tombol sekali lagi.");
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Koneksi suara belum siap.");
  
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
    if (!base64Audio) throw new Error("Gagal mendapatkan data suara.");
    return base64Audio;
  } catch (error: any) {
    console.error("TTS Error:", error);
    throw error;
  }
};
