import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { motion } from 'motion/react';
import CustomCursor from '../components/CustomCursor';
import { API_URL } from '../config';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const statusColors: Record<string, string> = {
  'pending': '#f59e0b',    // Orange
  'verified': '#3b82f6',   // Blue
  'assigned': '#a855f7',   // Purple
  'in-progress': '#10b981',// Emerald
  'resolved': '#10b981'    // Emerald
};

const createCustomIcon = (status: string, priority: string) => {
  const isHigh = priority === 'high';
  const color = isHigh ? '#ef4444' : (statusColors[status] || '#ffffff');
  const isActionNeeded = status === 'in-progress' || status === 'assigned' || isHigh;
  
  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; items-center; justify-center;">
        ${isActionNeeded ? `
          <div style="
            position: absolute;
            width: 24px;
            height: 24px;
            background-color: ${color};
            border-radius: 50%;
            opacity: 0.4;
            animation: marker-pulse 1.5s infinite;
          "></div>
        ` : ''}
        <div style="
          position: relative;
          background-color: ${color};
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px ${color}80;
          z-index: 2;
        "></div>
      </div>
    `,
    className: 'custom-status-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

interface ActiveReport {
  id: number;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  priority: string;
  animal_type: string | null;
  created_at: string;
}

export default function Track() {
  const [activeReports, setActiveReports] = useState<ActiveReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveReports();
    const interval = setInterval(fetchActiveReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveReports = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reports/public-active`);
      if (res.ok) {
        const data = await res.json();
        setActiveReports(data);
      }
    } catch (e) {
      console.error("Error fetching active reports:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-ink text-paper font-sans">
      <CustomCursor />
      <Navbar dark />

      {/* Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      
      {/* Decorative Blur */}
      <div className="fixed -top-1/4 -right-1/4 w-[80vw] h-[80vw] bg-primary/20 blur-[150px] rounded-full pointer-events-none z-0" />

      <main className="relative z-10 pt-32 pb-24 px-6 lg:px-12 max-w-[90rem] mx-auto min-h-screen flex flex-col">
        
        {/* Header */}
        <div className="mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-5xl md:text-7xl font-medium tracking-tight mb-4"
          >
            Active <span className="italic text-primary font-light">Operations</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-paper/60 text-lg max-w-xl font-light"
          >
            Real-time monitoring of all ongoing rescue dispatch units across Parañaque City. Data is synchronized live from field operatives.
          </motion.p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
          
          {/* Main Leaflet Map Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-8 bg-black/40 rounded-[2vw] border border-paper/10 overflow-hidden relative min-h-[500px] z-0"
          >
            <MapContainer 
              center={[14.47, 121.0]} 
              zoom={12} 
              style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap'
              />
              {activeReports.filter(r => r.latitude && r.longitude && r.status !== 'resolved' && r.status !== 'rejected').map(r => (
                <Marker key={r.id} position={[r.latitude!, r.longitude!]} icon={createCustomIcon(r.status, r.priority)}>
                  <Popup className="text-ink">
                    <p className="font-bold text-sm">{r.title}</p>
                    <p className="text-[10px] opacity-60">{r.location}</p>
                    <div className="mt-2 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.priority === 'high' ? '#ef4444' : statusColors[r.status] }} />
                       <span className="text-[9px] font-bold uppercase tracking-widest">{r.status} {r.priority === 'high' ? '(CRITICAL)' : ''}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute top-8 left-8 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-paper/10 z-[1000] space-y-2">
               <p className="text-[8px] font-bold uppercase tracking-widest text-paper/40 mb-2">Live Legend</p>
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">High Priority</span>
               </div>
               <div className="h-px bg-white/5 my-1" />
               {Object.entries(statusColors).filter(([k]) => k !== 'resolved' && k !== 'rejected').map(([status, color]) => (
                 <div key={status} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-paper/70">{status}</span>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Activity List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-2"
          >
            {loading ? (
              <div className="p-10 text-center text-paper/40 italic text-sm">Loading operations data...</div>
            ) : activeReports.length === 0 ? (
              <div className="p-10 text-center text-paper/40 italic text-sm">No active operations at the moment.</div>
            ) : (
              activeReports.map((op, idx) => (
                <motion.div 
                  key={op.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                  className="bg-paper/5 backdrop-blur border border-paper/10 p-6 rounded-3xl hover:bg-paper/10 transition-colors group cursor-crosshair"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-1 text-primary">#SSR-{op.id.toString().padStart(4, '0')}</h3>
                      <p className="text-paper/80 font-serif text-xl">{op.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        op.status === 'pending' ? 'bg-yellow-400' :
                        op.status === 'verified' ? 'bg-blue-400' :
                        op.status === 'assigned' ? 'bg-purple-400 animate-pulse' :
                        op.status === 'in-progress' ? 'bg-orange-500 animate-pulse' : 'bg-green-400'
                      }`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-paper/60">{op.status}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-paper/40 border-t border-paper/10 pt-4 mt-4">
                    <span>{op.animal_type || 'Animal'}</span>
                    <span className="text-white/60 font-light font-sans text-[10px] lowercase">{new Date(op.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
          
        </div>
      </main>
    </div>
  );
}
