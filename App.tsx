
import React, { useState, useEffect, useRef } from 'react';
import MoodSelector from './components/MoodSelector';
import ContentDisplay from './components/ContentDisplay';
import Dashboard from './components/Dashboard';
import Cover from './components/Cover';
import AccessControl from './components/AccessControl';
import { HealingContent, MoodType } from './types';
import { generateHealingContent } from './services/geminiService';
import { saveMoodLog } from './services/historyService';
import { getMoodConfig, getRandomLoadingMessage } from './constants';
import { 
  auth, 
  db, 
  UserProfile, 
  logout, 
  onAuthStateChanged, 
  onSnapshot, 
  doc,
  isFirebaseConfigured 
} from './services/firebase';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [demoMode, setDemoMode] = useState(!isFirebaseConfigured);

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [content, setContent] = useState<HealingContent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [currentLogId, setCurrentLogId] = useState<string | undefined>(undefined);
  
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Handle Authentication
  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setAuthLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const unsubscribeProfile = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          }
          setAuthLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (loading && selectedMood) {
      setLoadingMessage(getRandomLoadingMessage(selectedMood));
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMessage(getRandomLoadingMessage(selectedMood));
      }, 2500);
    } else if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
    }
    return () => { if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current); };
  }, [loading, selectedMood]);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleReset = () => {
    setContent(null);
    setSelectedMood(null);
    setError(null);
  };

  const handleOpenKeySelector = async () => {
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        if (selectedMood) handleMoodSelect(selectedMood);
      }
    } catch (err) {
      console.error("Failed to open key selector", err);
    }
  };

  const currentConfig = selectedMood ? getMoodConfig(selectedMood) : null;
  const themeClass = currentConfig ? currentConfig.theme.background : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 dark:from-slate-900 dark:via-emerald-950 dark:to-teal-950';
  const textClass = currentConfig ? currentConfig.theme.primaryText : 'text-emerald-950 dark:text-emerald-50';
  const secondaryTextClass = currentConfig ? currentConfig.theme.secondaryText : 'text-slate-600 dark:text-slate-400';
  const accentButtonClass = currentConfig ? currentConfig.theme.ui.buttonSecondary : 'bg-white/80 text-emerald-800 border-emerald-100 hover:bg-emerald-50 dark:bg-slate-800 dark:text-emerald-200 dark:border-emerald-800 dark:hover:bg-emerald-900';

  const fetchContent = async (mood: MoodType) => {
    setLoading(true);
    setError(null);
    setContent(null);
    try {
      const data = await generateHealingContent(mood);
      setContent(data);
    } catch (err: any) {
      let errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("API Key is missing")) {
        errorMsg = "API Key tidak valid atau belum dikonfigurasi. Klik 'Atur API Key' untuk memperbaikinya.";
      }
      setError(errorMsg);
      if (!content) setSelectedMood(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = async (mood: MoodType) => {
    setSelectedMood(mood);
    const log = saveMoodLog(mood);
    setCurrentLogId(log.id);
    await fetchContent(mood);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-600 dark:text-emerald-400 font-medium animate-pulse text-sm">Menghubungkan ke Qalbu...</p>
      </div>
    );
  }

  // Tampilan jika konfigurasi Firebase belum ada
  if (!isFirebaseConfigured && !demoMode) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border border-amber-100 dark:border-amber-900/30">
          <div className="text-6xl mb-6">⚙️</div>
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-4">Konfigurasi Diperlukan</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Firebase belum terhubung. Silakan isi <b>API Key</b>, <b>Project ID</b>, dan <b>App ID</b> di file <code>.env</code> Anda.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => setDemoMode(true)}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95"
            >
              Lanjut Mode Demo (Tanpa Login)
            </button>
            <p className="text-xs text-slate-400">Preview akan muncul di atas setelah konfigurasi selesai.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !demoMode) {
    return <Cover onStart={() => {}} onOpenKeySelector={handleOpenKeySelector} />; 
  }

  const PageContent = (
    <div className={`min-h-screen bg-fixed relative transition-colors duration-1000 ease-in-out ${themeClass}`}>
      <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] dark:invert"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/60 dark:to-slate-900/60 pointer-events-none"></div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12 min-h-screen flex flex-col items-center animate-[fadeIn_1s_ease-out]">
        
        <div className="w-full flex justify-between items-center mb-10 px-2 md:px-4">
           <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={userProfile?.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.displayName || 'Guest'}`} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover"
                />
                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${secondaryTextClass}`}>Assalamualaikum,</span>
                <span className={`text-sm md:text-base font-bold ${textClass}`}>
                  {userProfile ? userProfile.displayName.split(' ')[0] : (demoMode ? 'Tamu' : 'Hamba Allah')}
                </span>
              </div>
           </div>

           <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center group">
             {selectedMood ? (
               <button 
                onClick={handleReset}
                className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-500 hover:scale-110 active:scale-95 shadow-lg border-2 ${accentButtonClass}`}
               >
                 <span className="text-2xl md:text-3xl relative z-10 animate-[bounce_3s_infinite]">{currentConfig?.icon}</span>
                 <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 whitespace-nowrap">Beranda</span>
               </button>
             ) : (
               <div className="p-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/40 dark:border-slate-700/50 shadow-sm">
                 <span className="text-2xl md:text-3xl">🕌</span>
               </div>
             )}
           </div>

           <div className="flex gap-2">
              <button onClick={toggleTheme} className={`p-2.5 backdrop-blur-sm border rounded-full transition-all shadow-sm ${accentButtonClass}`}>
                {darkMode ? "☀️" : "🌙"}
              </button>
              <button onClick={() => setShowDashboard(true)} className={`hidden sm:flex items-center gap-2 px-4 py-2.5 backdrop-blur-sm border rounded-full text-sm font-bold transition-all shadow-sm group ${accentButtonClass}`}>
                <span>📊</span> <span className="hidden md:inline">Jurnal</span>
              </button>
              {!demoMode && (
                <button onClick={() => logout()} className="p-2.5 backdrop-blur-sm border border-red-100/30 text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm">
                  🚪
                </button>
              )}
              {demoMode && isFirebaseConfigured && (
                <button onClick={() => setDemoMode(false)} className="p-2.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold px-4">
                  Login
                </button>
              )}
           </div>
        </div>

        {!content && !loading && !error && (
          <div className="text-center mb-10 md:mb-16 animate-fadeInUp">
            <h2 className={`text-3xl md:text-5xl font-serif font-bold mb-4 tracking-tight ${textClass}`}>Apa yang sedang Anda rasakan?</h2>
            <p className={`text-lg max-w-lg mx-auto opacity-80 ${secondaryTextClass}`}>Pilihlah suasana hati Anda saat ini, biarkan Al-Quran menyentuh hati.</p>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 animate-scaleIn">
            <div className="relative mb-8">
              <div className={`w-24 h-24 border-8 border-t-transparent rounded-full animate-spin ${currentConfig ? currentConfig.theme.accent.replace('text-', 'border-') : 'border-emerald-500'}`}></div>
              <div className="absolute inset-0 flex items-center justify-center text-4xl">
                {selectedMood ? getMoodConfig(selectedMood)?.icon : "🤲"}
              </div>
            </div>
            <p className={`text-xl font-serif font-bold text-center animate-pulse px-4 ${textClass}`}>{loadingMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-xl max-w-md text-center animate-scaleIn">
            <div className="text-5xl mb-4">😔</div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Terjadi kendala</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">{error}</p>
            <div className="space-y-3">
              <button onClick={() => selectedMood && fetchContent(selectedMood)} className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg">Coba Lagi</button>
              <button onClick={handleOpenKeySelector} className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-bold shadow-lg">🔑 Atur API Key</button>
              <button onClick={handleReset} className="w-full py-2 text-slate-500 text-sm">Kembali</button>
            </div>
          </div>
        )}

        {!content && !loading && !error && <MoodSelector onSelect={handleMoodSelect} disabled={loading} selectedMood={selectedMood} />}
        {content && !loading && currentConfig && <ContentDisplay data={content} onReset={handleReset} onRefresh={() => fetchContent(selectedMood as MoodType)} logId={currentLogId} config={currentConfig} />}

        <footer className="mt-auto pt-20 pb-10 text-center opacity-40 text-[10px] tracking-[0.3em] uppercase pointer-events-none font-bold">
          <p>&copy; {new Date().getFullYear()} Qur'an Mood</p>
        </footer>
      </main>

      <Dashboard isOpen={showDashboard} onClose={() => setShowDashboard(false)} />
    </div>
  );

  return demoMode ? PageContent : <AccessControl userProfile={userProfile}>{PageContent}</AccessControl>;
};

export default App;
