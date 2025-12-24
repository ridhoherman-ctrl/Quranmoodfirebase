
import React, { useEffect, useState, useMemo } from 'react';
import { MoodLog, MoodType, FavoriteItem } from '../types';
import { getMoodHistory, clearMoodHistory } from '../services/historyService';
import { getFavorites, removeFavorite } from '../services/favoriteService';
import { getMoodConfig, MOOD_CONFIGS } from '../constants';

interface DashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'history' | 'favorites';

const Dashboard: React.FC<DashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [history, setHistory] = useState<MoodLog[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(getMoodHistory());
      setFavorites(getFavorites());
    }
  }, [isOpen]);

  const handleClearHistory = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua data Jurnal Qur'an Mood Anda?")) {
      clearMoodHistory();
      setHistory([]);
    }
  };

  const handleRemoveFavorite = (id: string) => {
    if (window.confirm("Hapus item ini dari favorit?")) {
      removeFavorite(id);
      setFavorites(prev => prev.filter(item => item.id !== id));
    }
  };

  const allTimeStats = useMemo(() => {
    if (history.length === 0) return null;
    const total = history.length;
    const counts: Record<string, number> = {};
    history.forEach(h => counts[h.mood] = (counts[h.mood] || 0) + 1);
    let dominantMood = history[0].mood;
    let maxCount = 0;
    Object.entries(counts).forEach(([mood, count]) => {
      if (count > maxCount) { maxCount = count; dominantMood = mood as MoodType; }
    });
    return { total, dominant: getMoodConfig(dominantMood as MoodType), counts };
  }, [history]);

  const monthlyStats = useMemo(() => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentLogs = history.filter(h => h.timestamp >= thirtyDaysAgo);
    const counts: Record<string, number> = {};
    MOOD_CONFIGS.forEach(c => counts[c.type] = 0);
    let maxVal = 0;
    recentLogs.forEach(log => {
      counts[log.mood] = (counts[log.mood] || 0) + 1;
      if (counts[log.mood] > maxVal) maxVal = counts[log.mood];
    });
    return { counts, maxVal, total: recentLogs.length };
  }, [history]);

  const getBarColor = (mood: string) => {
    const colors: Record<string, string> = {
      [MoodType.HAPPY]: 'bg-yellow-400', [MoodType.GRATEFUL]: 'bg-emerald-500', [MoodType.OPTIMISTIC]: 'bg-cyan-400',
      [MoodType.CONFUSED]: 'bg-violet-400', [MoodType.ANXIOUS]: 'bg-indigo-400', [MoodType.RESTLESS]: 'bg-lime-400',
      [MoodType.GALAU]: 'bg-fuchsia-400', [MoodType.TIRED]: 'bg-orange-400', [MoodType.ANGRY]: 'bg-red-400',
      [MoodType.DISAPPOINTED]: 'bg-stone-400', [MoodType.LONELY]: 'bg-slate-400', [MoodType.SAD]: 'bg-blue-400'
    };
    return colors[mood] || 'bg-emerald-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] md:h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-scaleIn">
        
        <div className="relative bg-emerald-900 dark:bg-emerald-950 p-6 md:p-8 text-white shrink-0">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-serif font-bold mb-1">Jurnal Qur'an Mood</h2>
                <p className="text-emerald-200 opacity-90 text-sm">Rekaman jejak spiritual dan emosionalmu.</p>
              </div>
              <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setActiveTab('history')} className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'history' ? 'bg-white text-emerald-900 shadow-lg' : 'bg-emerald-800/50 text-emerald-100 hover:bg-emerald-800'}`}>📊 RIWAYAT</button>
              <button onClick={() => setActiveTab('favorites')} className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'favorites' ? 'bg-white text-emerald-900 shadow-lg' : 'bg-emerald-800/50 text-emerald-100 hover:bg-emerald-800'}`}>❤️ FAVORIT</button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950/50">
          <div className="p-6 md:p-8">
            {activeTab === 'history' && (
              <div className="space-y-8">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400"><div className="text-6xl mb-4">📖</div><p>Belum ada catatan perasaan.</p></div>
                ) : (
                  <>
                    {allTimeStats && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">📝</div>
                          <div><p className="text-[10px] text-slate-400 font-bold uppercase">Total Refleksi</p><p className="text-xl font-bold">{allTimeStats.total}</p></div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">{allTimeStats.dominant?.icon}</div>
                          <div><p className="text-[10px] text-slate-400 font-bold uppercase">Dominan</p><p className="text-xl font-bold">{allTimeStats.dominant?.type}</p></div>
                        </div>
                        <div className="bg-emerald-600 text-white p-5 rounded-3xl flex flex-col justify-center italic text-sm">"Ingatlah, hanya dengan mengingat Allah hati menjadi tenang."</div>
                      </div>
                    )}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-lg border">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Analisis 30 Hari</h3>
                        <button onClick={handleClearHistory} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest">Hapus Data</button>
                      </div>
                      <div className="h-56 flex items-end gap-3">
                        {MOOD_CONFIGS.map(c => {
                          const val = monthlyStats.counts[c.type] || 0;
                          const height = monthlyStats.maxVal > 0 ? (val / monthlyStats.maxVal) * 100 : 0;
                          return (
                            <div key={c.type} className="flex-1 flex flex-col items-center group">
                               <div className={`w-full ${getBarColor(c.type)} rounded-t-xl transition-all duration-700`} style={{ height: `${height || 2}%`, opacity: val === 0 ? 0.2 : 1 }}></div>
                               <span className="mt-2 text-xl group-hover:scale-125 transition-transform" title={c.type}>{c.icon}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="space-y-4">
                {favorites.length === 0 ? (
                  <div className="text-center py-20 text-slate-400"><div className="text-6xl mb-4">❤️</div><p>Simpan ayat yang paling menyentuh hatimu.</p></div>
                ) : (
                  favorites.map(item => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border shadow-sm group">
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{item.type.toUpperCase()} - {item.moodContext}</span>
                        <button onClick={() => handleRemoveFavorite(item.id)} className="text-slate-300 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                      {item.type === 'quran' ? (
                        <div className="space-y-2">
                           <p className="font-arabic text-xl text-right" dir="rtl">{(item.content as any).arabicText}</p>
                           <p className="text-sm italic">"{(item.content as any).translation}"</p>
                        </div>
                      ) : (
                        <p className="italic">"{(item.content as any).text}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
