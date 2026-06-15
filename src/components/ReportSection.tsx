import { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, MapPin, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ReportSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
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
          
          const base64String = canvas.toDataURL('image/jpeg', 0.7);
          setImageUrl(base64String);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section id="report" className="bg-paper py-24 md:py-32">
      <div className="max-w-[90rem] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
        
        {/* Left Side - Context */}
        <div className="lg:col-span-4 relative flex flex-col justify-between">
          <div className="sticky top-32">
            <h2 className="font-serif text-5xl lg:text-7xl font-medium leading-[0.9] tracking-tight mb-8 uppercase">
              Urgent <br/> <span className="italic text-primary">Dispatch</span>
            </h2>
            <p className="text-ink-muted text-lg mb-12 max-w-sm font-light">
              Time is critical for injured or distressed animals. Accurate information helps our units prepare the right equipment.
            </p>
            
            <div className="space-y-8">
              <div className="flex gap-4 items-start">
                <div className="p-3 rounded-full border border-ink text-ink mt-1">
                  <MapPin size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-bold uppercase tracking-widest text-xs mb-2">Pinpoint Accurately</h4>
                  <p className="text-ink-muted text-sm font-light">Provide landmarks along with the street name in Parañaque.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="p-3 rounded-full border border-ink text-ink mt-1">
                  <Camera size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-bold uppercase tracking-widest text-xs mb-2">Visual Evidence</h4>
                  <p className="text-ink-muted text-sm font-light">A photo helps the team prepare the right equipment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:col-span-8 flex items-center">
          <form 
            className="w-full space-y-12"
            onSubmit={(e) => { 
              e.preventDefault(); 
              navigate('/report-portal', { state: { location, description, image_url: imageUrl } });
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Your Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-transparent px-0 py-4 border-b-2 border-border focus:outline-none focus:border-ink transition-all text-2xl md:text-3xl font-serif text-ink placeholder:text-border"
                  required
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+63 9XX"
                  className="w-full bg-transparent px-0 py-4 border-b-2 border-border focus:outline-none focus:border-ink transition-all text-2xl md:text-3xl font-serif text-ink placeholder:text-border"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Exact Location</label>
              <input 
                type="text" 
                placeholder="BF Homes, Phase 1"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent px-0 py-4 border-b-2 border-border focus:outline-none focus:border-ink transition-all text-2xl md:text-4xl font-serif text-ink placeholder:text-border"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Animal Condition</label>
              <textarea 
                rows={3}
                placeholder="Describe the animal and its condition..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent px-0 py-4 border-b-2 border-border focus:outline-none focus:border-ink transition-all text-2xl md:text-4xl font-serif text-ink placeholder:text-border resize-none"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Photo Evidence (Optional)</label>
              <div className="flex items-center gap-6">
                <label className="cursor-pointer px-6 py-4 border-2 border-dashed border-border rounded-xl hover:border-ink transition-colors flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-ink-muted bg-white/5">
                  <Camera size={18} />
                  Choose Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="hidden" 
                  />
                </label>
                {imageUrl && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-border bg-black/5">
                    <img src={imageUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 flex flex-col md:flex-row items-center gap-8 border-t border-border mt-12">
               <button 
                 type="submit" 
                 className="w-full md:w-auto px-12 py-6 rounded-full bg-ink text-white font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-4 hover:bg-primary transition-all shadow-xl"
               >
                 Enter Dispatch Portal <Send size={16} />
               </button>
               <p className="text-xs text-ink-lighter uppercase tracking-widest font-bold max-w-xs">
                 False reporting wastes valuable resources. Please act responsibly.
               </p>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
}
