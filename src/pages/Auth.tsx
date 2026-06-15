import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

import { API_URL } from '../config';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/api/login' : '/api/signup';
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to rescue server. Ensure backend is running.');
    }
  };

  return (
    <div className="min-h-screen bg-ink text-paper selection:bg-primary/30 overflow-hidden relative">
      <Navbar dark />
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-primary blur-[160px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1.3, 1, 1.3],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-primary-light blur-[140px] rounded-full"
        />
        <div className="absolute inset-0 bg-ink opacity-40 mix-blend-multiply" />
      </div>

      <div className="relative z-10 pt-32 pb-20 px-6 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg"
        >
          {/* Form Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="inline-flex items-center justify-center w-28 h-28 mb-6 overflow-hidden rounded-[2rem] shadow-lg"
            >
              <img src="/images/shield-dog.svg" alt="Rescue Network Shield" className="w-full h-full object-cover scale-[1.45] rounded-[2rem] opacity-95" />
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-serif italic mb-4 tracking-tighter">
              {isLogin ? 'System Login' : 'User Registration'}
            </h1>
            <p className="text-white/40 font-light tracking-widest uppercase text-[10px]">
              {isLogin ? 'Authorized access for the rescue network' : 'Register for an account to participate'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-zinc-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[2.5rem] pointer-events-none" />
            
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="space-y-6">
                <div className="group/input">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-3 ml-1 group-focus-within/input:text-primary transition-colors">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-lg placeholder:text-white/10"
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="group/input">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-3 ml-1 group-focus-within/input:text-primary transition-colors">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-lg placeholder:text-white/10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              {error && (
                <motion.p 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-red-400 text-xs text-center font-bold uppercase tracking-widest bg-red-400/10 py-3 rounded-xl border border-red-400/20"
                >
                  {error}
                </motion.p>
              )}
              
              <button 
                type="submit"
                className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-primary hover:text-white transition-all duration-500 flex items-center justify-center gap-3 group/btn shadow-xl"
              >
                {isLogin ? 'Login' : 'Register Account'}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
            
            <div className="mt-10 pt-10 border-t border-white/5 text-center relative z-10">
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-4">
                {isLogin ? "No account yet?" : "Already have an account?"}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-white hover:text-primary underline underline-offset-4 decoration-white/20 hover:decoration-primary transition-all"
                >
                  {isLogin ? 'Sign up' : 'Login instead'}
                </button>
              </p>
            </div>
          </div>

          {/* System Info Note */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-center"
          >
            <p className="text-[9px] uppercase tracking-[0.5em] text-white/20 font-medium">
              Secure System Access • Smart Stray Rescue Project
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
