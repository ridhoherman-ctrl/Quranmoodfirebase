
import React, { useState, useEffect } from 'react';
import MoodSelector from './components/MoodSelector';
import ContentDisplay from './components/ContentDisplay';
import Dashboard from './components/Dashboard';
import Cover from './components/Cover';
import AccessControl from './components/AccessControl';
import { HealingContent, MoodType, UserProfile } from './types';
import { generateHealingContent } from './services/geminiService';
import { saveMoodLog } from './services/historyService';
import { getMoodConfig, getRandomLoadingMessage } from './constants';
import { 
  auth, 
  db, 
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
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setAuthLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser: any) => {
      if (currentUser) {
        setUser(currentUser);
        const unsubscribeProfile = onSnapshot(doc(db!, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          }
          setAuthLoading(false);
        }, (err) => {
          console.error("Profile Fetch Error:", err);
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

  const fetchContent = async (mood: MoodType) => {
    setLoading(true);
    setLoadingMessage(getRandomLoadingMessage(mood));
    setError(null);
    try {
      const data = await generateHealingContent(mood);
      setContent(data);
    } catch (err: any) {
      setError(err.message || "Terjadi kendala koneksi.");
      setSelectedMood(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = async (mood: MoodType) => {
    setSelectedMood(mood);
    saveMoodLog(mood);
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
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-emerald-400 blur-3xl opacity-20 animate-pulse"></div>
           <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-emerald-600 dark:text-emerald-400 font-bold tracking-[0.2em] animate-pulse text-xs uppercase">Menghubungkan Qalbu</p>
      </div>
    );
  }

  if (!user && !demoMode) {
    return <Cover onStart={() => {}} />; 
  }

  const currentConfig = selectedMood ? getMoodConfig(selectedMood) : null;
  const themeClass = currentConfig ? currentConfig.theme.background : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 dark:from-slate-900 dark:via-emerald-950 dark:to-teal-950';

  const MainApp = (
    <div className={`min-h-screen bg-fixed relative transition-colors duration-1000 ${themeClass}`}>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] dark:invert"></div>
      
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12 min-h-screen flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-12 px-2">
           <div className="flex items-center gap-3">
              <div className="relative group">
                 <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-400 to-teal-400 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                 <img 
                    src={userProfile?.photoURL || `https://ui-avatars.com/api/?name=User&background=059669&color=fff`} 
                    className="relative w-11 h-11 rounded-full border-2 border-white dark:border-slate-800 shadow-lg object-cover"
                    alt="Profile"
                  />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">Assalamualaikum,</span>
                <span className="text-sm font-bold dark:text-white leading-tight">{userProfile?.displayName || 'Tamu'}</span>
              </div>
           </div>

           <div className="flex gap-2">
              <button onClick={toggleTheme} className="p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 dark:border-slate-700 transition-transform active:scale-90" title="Ubah Tema">{darkMode ? "☀️" : "🌙"}</button>
              <button onClick={() => setShowDashboard(true)} className="p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 dark:border-slate-700 transition-transform active:scale-90" title="Riwayat & Statistik">📊</button>
              {!demoMode && <button onClick={() => logout()} className="p-3 bg-red-50/60 dark:bg-red-950/30 backdrop-blur-md text-red-500 rounded-2xl shadow-sm border border-red-100/50 dark:border-red-900/30 transition-transform active:scale-90" title="Keluar">🚪</button>}
           </div>
        </div>

        {loading && selectedMood && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 animate-fadeIn text-center max-w-lg">
            <div className="relative mb-16">
              {/* Enhanced Spiritual Halo Animation */}
              <div className="absolute inset-[-60px] blur-[80px] rounded-full bg-emerald-400/30 animate-breathing"></div>
              <div className="absolute inset-[-20px] border-2 border-dashed border-emerald-500/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
              
              <div className="relative w-40 h-40 bg-white dark:bg-slate-800 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.12)] flex items-center justify-center border-2 border-white/50 dark:border-slate-700">
                <span className="text-8xl animate-bounce drop-shadow-2xl">{currentConfig?.icon || '⏳'}</span>
                <div className="absolute inset-[-8px] border-4 border-emerald-500 border-t-transparent border-b-transparent rounded-full animate-spin"></div>
              </div>
            </div>

            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-2xl font-serif font-bold text-slate-800 dark:text-white tracking-tight">
                Meresapi Mood {selectedMood}...
              </h3>
              <div className="px-10">
                <p className="text-lg md:text-xl text-emerald-800 dark:text-emerald-400 font-medium italic leading-relaxed opacity-90">
                  "{loadingMessage}"
                </p>
              </div>
            </div>

            <div className="mt-14 flex gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 animate-pulse"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse [animation-delay:200ms]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 animate-pulse [animation-delay:400ms]"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl max-w-md text-center border border-red-100 dark:border-red-900/20 animate-scaleIn">
            <div className="text-6xl mb-6">⚠️</div>
            <h3 className="text-xl font-bold mb-3 text-red-600">Terjadi Kendala</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm leading-relaxed">{error}</p>
            <button onClick={() => handleReset()} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95">Coba Lagi</button>
          </div>
        )}

        {!content && !loading && !error && (
          <>
            <div className="text-center mb-14 animate-fadeInUp">
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-800 dark:text-white mb-4 tracking-tight">Apa kabar hatimu?</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Pilih suasana hatimu untuk mendapatkan tuntunan dari kalam Allah.</p>
            </div>
            <MoodSelector onSelect={handleMoodSelect} disabled={loading} selectedMood={selectedMood} />
          </>
        )}

        {content && !loading && currentConfig && (
          <ContentDisplay 
            key={content.quran.surahNumber + '-' + content.quran.ayahNumber} 
            data={content} 
            onReset={handleReset} 
            onRefresh={() => fetchContent(selectedMood as MoodType)}
            config={currentConfig}
          />
        )}
      </main>

      <Dashboard 
        isOpen={showDashboard} 
        onClose={() => setShowDashboard(false)} 
      />
    </div>
  );

  return demoMode ? MainApp : <AccessControl userProfile={userProfile}>{MainApp}</AccessControl>;
};

export default App;
