import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, Send, Loader2, CheckCircle, BrainCircuit, Activity, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { API_URL } from '../config';

export default function ReportPortal() {
  const { token } = useAuth();
  const routerLocation = useLocation();
  const locationState = routerLocation.state as { location?: string, description?: string, image_url?: string } | null;
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const defaultColabUrl = (import.meta as any).env.VITE_COLAB_URL || localStorage.getItem('colab_url') || '';
  const [colabUrl, setColabUrl] = useState(defaultColabUrl);
  const [formData, setFormData] = useState({
    title: '',
    description: locationState?.description || '',
    location: locationState?.location || '',
    priority: 'medium',
    latitude: null as number | null,
    longitude: null as number | null,
    image_url: locationState?.image_url || '',
    animal_type: '',
    ai_confidence: 0,
    facial_expression: ''
  });

  const handleLocationCapture = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      }, (error) => {
        alert("Please enable location services to submit a report.");
        console.error("Error capturing location:", error);
      });
    }
  };

  const runAIInference = async (imageData: string) => {
    setIsScanning(true);
    
    try {
      // Allow sending without token if anonymous
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/ai/predict`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: imageData, colabUrl })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
         throw new Error(data.error || "Failed to process AI response");
      }

      setFormData(prev => ({
        ...prev,
        animal_type: data.animal_type || 'Unknown',
        ai_confidence: data.confidence || 0,
        facial_expression: data.expression || 'Neutral',
        title: `${data.animal_type || 'Animal'} Report`,
        description: data.description || `AI Analysis: ${data.animal_type} identified with ${data.expression} expression (${((data.confidence || 0) * 100).toFixed(1)}% confidence).`
      }));
    } catch (err: any) {
      console.error("AI Service Error:", err);
      alert(`AI Analysis Failed: ${err.message}`);
      setFormData(prev => ({
        ...prev,
        animal_type: '',
        ai_confidence: 0,
        facial_expression: '',
        description: ''
      }));
    }
    
    setIsScanning(false);
  };

  useEffect(() => {
    if (locationState?.image_url) {
      runAIInference(locationState.image_url);
    }
  }, [locationState]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Resize image to prevent localtunnel payload size crashes
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let scaleSize = 1;
          if (img.width > MAX_WIDTH) {
             scaleSize = MAX_WIDTH / img.width;
          }
          canvas.width = img.width * scaleSize;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Compress to JPEG at 70% quality
          const base64String = canvas.toDataURL('image/jpeg', 0.7);
          
          setFormData(prev => ({ ...prev, image_url: base64String }));
          runAIInference(base64String);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url || !formData.latitude) {
      alert("Required: Photo evidence and GPS location.");
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem('colab_url', colabUrl);
      const endpoint = token ? `${API_URL}/api/reports` : `${API_URL}/api/reports/anonymous`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'Failed to submit report'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 p-12 rounded-[3rem] text-center max-w-lg">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={48} className="text-primary" />
          </div>
          <h2 className="text-4xl font-serif italic text-paper mb-4">Report Submitted</h2>
          <p className="text-paper/60 mb-10">Your report has been received and is being processed by the rescue network.</p>
          <button onClick={() => setSuccess(false)} className="px-8 py-4 bg-primary text-ink font-bold uppercase tracking-widest text-xs rounded-2xl">
            Submit New Report
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-paper selection:bg-primary/30 relative overflow-hidden">
      <Navbar dark />
      
      <main className="relative z-10 pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
           <div>
             <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-8xl font-serif italic mb-4">
               Report <span className="text-primary-light">Portal</span>
             </motion.h1>
             <p className="text-paper/40 uppercase tracking-[0.3em] text-[10px] font-bold">Stray Animal Incident Reporting System</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Media & AI */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-primary">Photo Evidence</label>
              <label className="block w-full cursor-pointer group">
                <div className="relative w-full aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center group-hover:border-primary/40 transition-all overflow-hidden">
                  {formData.image_url ? (
                    <>
                      <img src={formData.image_url} alt="Incident" className="w-full h-full object-cover" />
                      <AnimatePresence>
                        {isScanning && (
                          <motion.div initial={{ top: '0%' }} animate={{ top: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_15px_rgba(125,157,133,1)] z-20" />
                        )}
                      </AnimatePresence>
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-ink to-transparent">
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Animal Expression</p>
                               <p className="text-2xl font-serif italic text-paper capitalize">{formData.facial_expression || 'Analyzing...'}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">AI Confidence</p>
                               <p className="text-xl font-bold text-paper">{(formData.ai_confidence * 100).toFixed(0)}%</p>
                            </div>
                         </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera size={48} className="text-white/10 mb-4 group-hover:scale-110 transition-transform" />
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-20">Click to upload photo</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
              </label>
            </div>

            <AnimatePresence>
              {formData.animal_type && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-primary/10 rounded-[2.5rem] border border-primary/20 space-y-6">
                   <div className="flex justify-between items-center pb-4 border-b border-primary/10">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Classification</p>
                      <Activity size={14} className="text-primary animate-pulse" />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <p className="text-[9px] opacity-40 uppercase tracking-widest mb-1">Species</p>
                         <p className="text-2xl font-serif">{formData.animal_type}</p>
                      </div>
                      <div>
                         <p className="text-[9px] opacity-40 uppercase tracking-widest mb-1">Accuracy</p>
                         <p className="text-2xl font-serif">{(formData.ai_confidence * 100).toFixed(1)}%</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl">
                      <ShieldAlert size={14} className="text-orange-400" />
                      <p className="text-[9px] font-bold uppercase tracking-widest text-orange-400">Status: Pending Verification</p>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-7 space-y-10 pt-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Location Address" placeholder="Street name, landmark..." value={formData.location} onChange={v => setFormData({...formData, location: v})} />
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-primary">GPS Coordinates</label>
                  <button type="button" onClick={handleLocationCapture} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex justify-between items-center group hover:border-primary/30 transition-all">
                    <span className="text-sm opacity-50 font-serif">{formData.latitude ? `${formData.latitude.toFixed(4)}, ${formData.longitude?.toFixed(4)}` : 'Update Location'}</span>
                    <MapPin size={18} className={formData.latitude ? "text-primary" : "text-white/20"} />
                  </button>
                </div>
             </div>

             <InputField label="Report Title" placeholder="Short summary of the situation" value={formData.title} onChange={v => setFormData({...formData, title: v})} />
             
             <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-primary">Incident Description</label>
                <textarea 
                  rows={4}
                  placeholder="Describe the animal and its condition..."
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 focus:outline-none focus:border-primary/50 transition-colors resize-none text-paper placeholder:text-white/10 font-serif text-lg"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
             </div>

             <button 
               type="submit" 
               disabled={loading || isScanning} 
               className="w-full py-8 bg-paper text-ink font-bold uppercase tracking-[0.4em] text-xs rounded-[2rem] hover:bg-primary transition-all flex items-center justify-center gap-4 disabled:opacity-50"
             >
               {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
               Submit Report
             </button>
          </div>

        </form>
      </main>
    </div>
  );
}

function InputField({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold uppercase tracking-widest text-primary">{label}</label>
      <input 
        type="text" 
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary/50 transition-colors text-paper placeholder:text-white/10"
        value={value}
        onChange={e => onChange(e.target.value)}
        required
      />
    </div>
  );
}
