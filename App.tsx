
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
  
  const [darkMode, setDarkMode] = useState<boolean>(false);

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

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleOpenKeySelector = async () => {
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        if (selectedMood) handleMoodSelect(selectedMood);
      } else {
        alert("Fitur pemilihan kunci tidak tersedia di lingkungan ini.");
      }
    } catch (err) {
      console.error("Failed to open key selector", err);
    }
  };

  const fetchContent = async (mood: MoodType) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateHealingContent(mood);
      setContent(data);
    } catch (err: any) {
      let errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      if (errorMsg.includes("API Key is missing") || errorMsg.includes("not found")) {
        errorMsg = "API Key Gemini belum diset atau tidak valid. Silakan klik 'Atur API Key' di pojok atas atau di bawah.";
      }
      setError(errorMsg);
      setSelectedMood(null);
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

  const handleReset = () => {
    setContent(null);
    setSelectedMood(null);
    setError(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-600 dark:text-emerald-400 font-medium">Menghubungkan Qalbu...</p>
      </div>
    );
  }

  if (!isFirebaseConfigured && !demoMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-950 dark:to-emerald-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-emerald-100 dark:border-emerald-900/30 animate-scaleIn">
          <div className="text-6xl mb-6">🕌</div>
          <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-4">Selamat Datang di Qur'an Mood</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Untuk pengalaman penuh (simpan riwayat & favorit), silakan hubungkan Firebase. Jika hanya ingin mencoba, Anda bisa masuk menggunakan <b>Mode Demo</b>.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => setDemoMode(true)}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
            >
              Masuk Mode Demo
            </button>
            <button 
              onClick={handleOpenKeySelector}
              className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              🔑 Atur API Key Gemini
            </button>
          </div>
          <p className="mt-8 text-xs text-slate-400 uppercase tracking-widest font-bold italic">Ketenangan jiwa dalam genggaman</p>
        </div>
      </div>
    );
  }

  if (!user && !demoMode) {
    return <Cover onStart={() => {}} onOpenKeySelector={handleOpenKeySelector} />; 
  }

  const currentConfig = selectedMood ? getMoodConfig(selectedMood) : null;
  const themeClass = currentConfig ? currentConfig.theme.background : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 dark:from-slate-900 dark:via-emerald-950 dark:to-teal-950';

  const MainApp = (
    <div className={`min-h-screen bg-fixed relative transition-colors duration-1000 ${themeClass}`}>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] dark:invert"></div>
      
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12 min-h-screen flex flex-col items-center">
        {/* Header Section */}
        <div className="w-full flex justify-between items-center mb-12 px-2">
           <div className="flex items-center gap-3">
              <img 
                src={`https://ui-avatars.com/api/?name=${userProfile?.displayName || 'Tamu'}&background=059669&color=fff`} 
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                alt="Profile"
              />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 dark:text-white">Assalamualaikum,</span>
                <span className="text-sm font-bold dark:text-white">{userProfile?.displayName || 'Tamu'}</span>
              </div>
           </div>

           <div className="flex gap-2">
              <button onClick={handleOpenKeySelector} className="p-2.5 bg-white/80 dark:bg-slate-800 rounded-full shadow-sm hover:bg-amber-50" title="Atur API Key">🔑</button>
              <button onClick={toggleTheme} className="p-2.5 bg-white/80 dark:bg-slate-800 rounded-full shadow-sm">{darkMode ? "☀️" : "🌙"}</button>
              <button onClick={() => setShowDashboard(true)} className="p-2.5 bg-white/80 dark:bg-slate-800 rounded-full shadow-sm">📊</button>
              {!demoMode && <button onClick={() => logout()} className="p-2.5 bg-red-50 text-red-500 rounded-full shadow-sm">🚪</button>}
           </div>
        </div>

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 border-8 border-emerald-500 border-t-transparent rounded-full animate-spin mb-8"></div>
            <p className="text-xl font-serif font-bold animate-pulse text-emerald-800 dark:text-emerald-200">{loadingMessage || "Membuka lembaran cahaya..."}</p>
          </div>
        )}

        {error && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-md text-center border border-red-100 animate-scaleIn">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2">Kendala Koneksi</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">{error}</p>
            <button onClick={() => handleReset()} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold">Kembali</button>
          </div>
        )}

        {!content && !loading && !error && (
          <>
            <div className="text-center mb-12 animate-fadeInUp">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-800 dark:text-white mb-4">Apa kabar hatimu?</h1>
              <p className="text-slate-600 dark:text-slate-300">Pilih suasana hati Anda saat ini untuk mendapatkan penguatan spiritual.</p>
            </div>
            <MoodSelector onSelect={handleMoodSelect} disabled={loading} selectedMood={selectedMood} />
          </>
        )}

        {content && !loading && currentConfig && (
          <ContentDisplay 
            data={content} 
            onReset={handleReset} 
            onRefresh={() => handleMoodSelect(selectedMood as MoodType)}
            logId={currentLogId}
            config={currentConfig}
          />
        )}
      </main>

      <Dashboard isOpen={showDashboard} onClose={() => setShowDashboard(false)} />
    </div>
  );

  return demoMode ? MainApp : <AccessControl userProfile={userProfile}>{MainApp}</AccessControl>;
};

export default App;
