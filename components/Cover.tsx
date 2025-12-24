
import React, { useState } from 'react';
import { loginWithEmail, registerWithEmail } from '../services/firebase';

interface CoverProps {
  onStart: () => void;
}

const Cover: React.FC<CoverProps> = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        if (!name) throw new Error("Nama harus diisi");
        await registerWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Terjadi kesalahan sistem.";
      if (err.code === 'auth/user-not-found') msg = "Email tidak terdaftar.";
      if (err.code === 'auth/wrong-password') msg = "Password salah.";
      if (err.code === 'auth/invalid-credential') msg = "Email atau password salah.";
      if (err.code === 'auth/email-already-in-use') msg = "Email sudah digunakan.";
      if (err.code === 'auth/weak-password') msg = "Password minimal 6 karakter.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 dark:from-slate-950 dark:via-emerald-950 dark:to-teal-950 flex flex-col items-center justify-center p-6 transition-colors duration-1000">
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] dark:invert"></div>
      
      <div className="relative z-10 max-w-md w-full flex flex-col items-center">
        <div className="mb-8 text-center animate-fadeInUp">
          <div className="relative group mx-auto mb-6">
             <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
             <div className="relative w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-900 mx-auto transform hover:rotate-6 transition-transform">
                <span className="text-5xl animate-pulse">🕌</span>
             </div>
          </div>
          <h1 className="text-4xl font-serif font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Qur'an <span className="text-emerald-600 dark:text-emerald-400">Mood</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 italic">
            "Tenangkan hati dengan kalam Ilahi"
          </p>
        </div>

        <div className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white dark:border-slate-800 animate-scaleIn">
          <div className="flex gap-4 mb-8 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button 
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isRegister ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
            >
              Masuk
            </button>
            <button 
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isRegister ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all outline-none"
                  placeholder="Nama panggil"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all outline-none"
                placeholder="email@contoh.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all outline-none pr-12"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                <span className="text-sm">⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 dark:shadow-none transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isRegister ? "Buat Akun" : "Masuk Sekarang"}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-[11px] text-slate-400 dark:text-slate-600 text-center max-w-[250px] leading-relaxed">
          "Barangsiapa yang menempuh jalan untuk mencari ilmu, maka Allah akan mudahkan baginya jalan menuju surga."
        </p>
      </div>
    </div>
  );
};

export default Cover;
