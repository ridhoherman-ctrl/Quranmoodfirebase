
import React, { useState, useEffect } from 'react';
import { HealingContent, MoodConfig, FavoriteItem } from '../types';
import AudioPlayer from './AudioPlayer';
import { updateMoodLog } from '../services/historyService';
import { 
  saveFavorite, 
  removeFavorite, 
  isFavorited, 
  generateQuranId, 
  generateHadithId 
} from '../services/favoriteService';

interface ContentDisplayProps {
  data: HealingContent;
  onReset: () => void;
  onRefresh: () => void;
  logId?: string;
  config: MoodConfig; 
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ data, onReset, onRefresh, logId, config }) => {
  const [journalEntry, setJournalEntry] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  
  // Favorites State
  const [isQuranSaved, setIsQuranSaved] = useState(false);
  const [isHadithSaved, setIsHadithSaved] = useState(false);

  const { theme } = config;

  // IDs for content
  const quranId = generateQuranId(data.quran.surahNumber, data.quran.ayahNumber);
  const hadithId = generateHadithId(data.hadith.text);

  useEffect(() => {
    setIsQuranSaved(isFavorited(quranId));
    setIsHadithSaved(isFavorited(hadithId));
  }, [quranId, hadithId, data]);

  // Construct Quran Audio URL
  const surahPad = data.quran.surahNumber.toString().padStart(3, '0');
  const ayahPad = data.quran.ayahNumber.toString().padStart(3, '0');
  const quranAudioUrl = `https://everyayah.com/data/Alafasy_128kbps/${surahPad}${ayahPad}.mp3`;

  const handleSaveJournal = () => {
    if (!journalEntry.trim()) return;
    if (logId) updateMoodLog(logId, journalEntry);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(label);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const toggleFavoriteQuran = () => {
    if (isQuranSaved) {
      removeFavorite(quranId);
      setIsQuranSaved(false);
    } else {
      const item: FavoriteItem = {
        id: quranId,
        type: 'quran',
        content: data.quran,
        timestamp: Date.now(),
        moodContext: data.mood
      };
      saveFavorite(item);
      setIsQuranSaved(true);
    }
  };

  const toggleFavoriteHadith = () => {
    if (isHadithSaved) {
      removeFavorite(hadithId);
      setIsHadithSaved(false);
    } else {
      const item: FavoriteItem = {
        id: hadithId,
        type: 'hadith',
        content: data.hadith,
        timestamp: Date.now(),
        moodContext: data.mood
      };
      saveFavorite(item);
      setIsHadithSaved(true);
    }
  };

  const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 transition-all duration-300 ${filled ? 'text-rose-500 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-rose-400'}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-16 animate-fadeIn">
      
      {/* Summary Header */}
      <div 
        className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border rounded-xl p-6 text-center shadow-sm ${theme.border}`}
      >
        <h2 className={`text-lg font-medium italic ${theme.accent}`}>
          "{data.summary}"
        </h2>
      </div>

      {/* Main Quran Card */}
      <div className={`bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden border ${theme.border} relative`}>
        <div className={`h-2.5 w-full ${theme.ui.highlight}`}></div>
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-8">
            <span className={`text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest ${theme.ui.pill}`}>
              Kalam Ilahi
            </span>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-3">
                 <button 
                  onClick={() => handleCopy(`${data.quran.arabicText}\n\n${data.quran.translation}\n(QS. ${data.quran.surahName}: ${data.quran.ayahNumber})`, "Ayat disalin")}
                  className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-500 transition-colors"
                 >
                   {copyStatus === "Ayat disalin" ? "✅" : "📋"}
                 </button>
                 <button onClick={toggleFavoriteQuran} className="p-2 rounded-full hover:bg-rose-50 transition-colors">
                   <HeartIcon filled={isQuranSaved} />
                 </button>
                 <div className={`font-serif text-xl font-bold ${theme.accent}`}>
                  {data.quran.surahName}: {data.quran.ayahNumber}
                 </div>
              </div>
              <AudioPlayer mode="url" src={quranAudioUrl} label="Dengar Ayat" className={`${theme.ui.iconBg} hover:opacity-80`} />
            </div>
          </div>
          
          <div className="mb-10 text-right" dir="rtl">
            <p className="font-arabic text-4xl md:text-6xl leading-[1.8] text-slate-800 dark:text-slate-100">
              {data.quran.arabicText}
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border-l-4 border-emerald-500 italic text-slate-700 dark:text-slate-300 text-lg md:text-xl leading-relaxed">
            "{data.quran.translation}"
          </div>
        </div>
      </div>

      {/* Hadith Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg overflow-hidden border border-amber-200 dark:border-amber-900/50">
         <div className="bg-amber-400 h-2 w-full"></div>
         <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Hadist Pendukung</span>
            <button onClick={toggleFavoriteHadith} className="p-2 rounded-full hover:bg-rose-50 transition-colors">
              <HeartIcon filled={isHadithSaved} />
            </button>
          </div>
          <blockquote className="text-xl font-serif text-slate-700 dark:text-slate-200 leading-relaxed mb-4 text-center">
            "{data.hadith.text}"
          </blockquote>
          <div className="text-center">
             <cite className="not-italic text-xs font-bold text-slate-400 uppercase tracking-widest">{data.hadith.source}</cite>
          </div>
         </div>
      </div>

      {/* Integrated Wisdom & Practical Steps */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className={`bg-white dark:bg-slate-800 border ${theme.border} rounded-3xl p-8 shadow-lg space-y-6`}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💡</span>
              <h3 className={`font-serif text-2xl font-semibold ${theme.accent}`}>Hikmah Ayat</h3>
            </div>
            <p className="leading-relaxed font-medium text-slate-700 dark:text-slate-300">{data.wisdom}</p>
          </div>
          
          <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🌿</span>
              <h3 className={`font-serif text-2xl font-semibold ${theme.accent}`}>Amalan Khusus</h3>
            </div>
            <ul className="space-y-4">
              {data.practicalSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${theme.ui.pill}`}>{idx + 1}</span>
                  <span className="text-slate-700 dark:text-slate-300">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border p-8">
          <h3 className="text-2xl font-serif font-bold mb-4">Renungan Hati</h3>
          <p className="text-sm text-slate-500 mb-6 italic">Pertanyaan untuk dirimu sendiri berdasarkan ayat di atas:</p>
          <ul className="space-y-4 text-slate-700 dark:text-slate-300 italic mb-8">
            {data.reflectionQuestions.map((q, i) => <li key={i} className="pl-4 border-l-2 border-emerald-300">• {q}</li>)}
          </ul>
          
          <div className="space-y-4">
            <textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              className="w-full h-32 p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
              placeholder="Tuliskan doa atau tekadmu hari ini..."
            />
            <button 
              onClick={handleSaveJournal}
              disabled={!journalEntry.trim()}
              className={`w-full py-4 rounded-2xl font-bold transition-all transform active:scale-95 ${journalEntry.trim() ? theme.ui.buttonPrimary : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              Simpan Catatan Hati
            </button>
            {showSuccess && <p className="text-center text-xs text-green-600 animate-fadeIn">✓ Tersimpan di Riwayat Hati</p>}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-12">
        <button 
          onClick={onRefresh} 
          className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 shadow-xl shadow-emerald-200 dark:shadow-none transition-all transform hover:-translate-y-1 active:scale-95 group"
        >
           <span className="text-xl group-hover:rotate-180 transition-transform duration-500">🔄</span>
           Ganti Ayat & Renungan
        </button>
        <button 
          onClick={onReset} 
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          Pilih Mood Lain
        </button>
      </div>
    </div>
  );
};

export default ContentDisplay;
