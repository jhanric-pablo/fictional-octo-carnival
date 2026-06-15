import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { API_URL } from '../config';
import { 
  ClipboardList, 
  Medal, 
  MapPin, 
  Clock, 
  CheckCircle,
  Info,
  User
} from 'lucide-react';

interface Report {
  id: number;
  title: string;
  status: string;
  created_at: string;
}

interface Achievement {
  badge_name: string;
  earned_at: string;
}

export default function CitizenDashboard() {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'reports' | 'badges'>('reports');
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (user && token) {
      fetchMyReports();
      fetchAchievements();
    }
  }, [user, loading, token, navigate]);

  const fetchMyReports = async () => {
    const res = await fetch(`${API_URL}/api/reports`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setMyReports(data.filter((r: any) => r.user_id === user?.id));
  };

  const fetchAchievements = async () => {
    const res = await fetch(`${API_URL}/api/achievements`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setAchievements(data);
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-ink text-paper selection:bg-primary/30 relative overflow-hidden">
      <Navbar dark />
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-primary/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 text-primary mb-4"
            >
              <User size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em]">User Information Portal</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-serif italic"
            >
              Activity <span className="text-primary-light">History</span>
            </motion.h1>
          </div>

          <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
            <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<ClipboardList size={16}/>} label="Reports" />
            <TabButton active={activeTab === 'badges'} onClick={() => setActiveTab('badges')} icon={<Medal size={16}/>} label="Badges" />
          </div>
        </div>

        <main className="flex-grow">
          <AnimatePresence mode="wait">
            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.4em] opacity-30 flex items-center gap-4">
                      My Submitted Reports
                      <div className="h-px flex-1 bg-white/5" />
                    </h2>
                    
                    {myReports.length === 0 ? (
                      <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20 italic font-serif text-2xl">
                        No reports found. Submit a report to start.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {myReports.map(report => (
                          <div key={report.id} className="p-8 bg-white/5 rounded-[2rem] border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <ClipboardList size={32} />
                              </div>
                              <div>
                                <h3 className="text-xl font-serif mb-1">{report.title}</h3>
                                <p className="text-[10px] opacity-40 uppercase tracking-widest">{new Date(report.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                               <div className="text-right">
                                  <p className="text-[10px] opacity-30 uppercase tracking-widest mb-1">Status</p>
                                  <span className="text-xs font-bold uppercase text-primary-light">{report.status}</span>
                               </div>
                               <button className="p-4 bg-white/5 rounded-xl hover:bg-primary/20 transition-colors">
                                  <Info size={16} />
                                </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-8 bg-primary/10 rounded-[2.5rem] border border-primary/20">
                      <h3 className="text-2xl font-serif italic mb-6">User Statistics</h3>
                      <div className="space-y-4">
                        <StatItem label="Resolved Reports" value={myReports.filter(r => r.status === 'resolved').length.toString()} icon={<CheckCircle size={14}/>} />
                        <StatItem label="Total Submissions" value={myReports.length.toString()} icon={<Clock size={14}/>} />
                        <StatItem label="Region" value="Parañaque" icon={<MapPin size={14}/>} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'badges' && (
              <motion.div key="badges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {achievements.map((badge, idx) => (
                  <div key={idx} className="p-8 bg-white/5 rounded-[2rem] border border-white/10 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-6">
                      <Medal size={40} />
                    </div>
                    <h4 className="text-xl font-serif mb-2">{badge.badge_name}</h4>
                    <p className="text-[10px] opacity-30 uppercase tracking-widest">Earned {new Date(badge.earned_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`px-6 py-3 rounded-xl flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${active ? 'bg-white text-ink shadow-lg' : 'text-white/40 hover:text-white'}`}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function StatItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <div className="flex items-center gap-2 opacity-40">
        {icon}
        <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
      </div>
      <span className="font-serif text-xl">{value}</span>
    </div>
  );
}
