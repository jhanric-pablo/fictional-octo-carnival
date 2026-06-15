import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
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
import { 
  Map as MapIcon, 
  History, 
  ShieldCheck, 
  Activity, 
  MapPin, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  BarChart3,
  Users,
  Search,
  X,
  Edit2,
  Trash2,
  Filter,
  ArrowUpRight
} from 'lucide-react';

interface Report {
  id: number;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  priority: string;
  image_url: string | null;
  animal_type: string | null;
  ai_confidence: number | null;
  facial_expression: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface User {
  id: number;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'ops';
  
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [reports, setReports] = useState<Report[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [assigningReportId, setAssigningReportId] = useState<number | null>(null);
  const [rescuerSearch, setRescuerSearch] = useState('');
  const [rescuerSort, setRescuerSort] = useState<'email' | 'id'>('email');

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (user && token) {
      fetchReports();
      fetchUsers();
    }
  }, [user, loading, token, navigate]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log(`[Dashboard] Fetched ${data.length} reports`);
      setReports(data);
    } catch (e) {
      console.error("[Dashboard] Fetch error:", e);
    }
  };

  const fetchUsers = async () => {
    try {
       const res = await fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } });
       if (res.ok) {
         const data = await res.json();
         setAllUsers(data);
       }
    } catch (e) { console.error(e); }
  };

  const deleteReport = async (id: number) => {
    if (!confirm("Delete this report permanently?")) return;
    await fetch(`${API_URL}/api/reports/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchReports();
  };

  const updateReport = async (id: number, payload: any) => {
    await fetch(`${API_URL}/api/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    setEditingReport(null);
    fetchReports();
  };

  const updateUserRole = async (id: number, role: string) => {
    await fetch(`${API_URL}/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ role })
    });
    fetchUsers();
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Delete this user permanently?")) return;
    await fetch(`${API_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchUsers();
  };

  if (loading || !user) return null;

  const rescuers = allUsers.filter(u => u.role === 'rescuer');
  const filteredRescuers = rescuers
    .filter(r => r.email.toLowerCase().includes(rescuerSearch.toLowerCase()))
    .sort((a, b) => {
      if (rescuerSort === 'email') {
        return a.email.localeCompare(b.email);
      }
      return a.id - b.id;
    });
  
  const filteredReports = reports.filter(r => {
    const matchesSearch = (r.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (r.location?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    verified: reports.filter(r => r.status === 'verified').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    rate: reports.length > 0 ? Math.round((reports.filter(r => r.status === 'resolved').length / reports.length) * 100) : 0
  };

  return (
    <div className="min-h-screen bg-ink text-paper selection:bg-primary/30 relative overflow-hidden">
      <Navbar dark />
      
      <div className="relative z-10 pt-32 pb-20 px-6 max-w-[100rem] mx-auto min-h-screen flex flex-col">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 text-primary mb-4">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em]">Command & Control Center</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-serif italic">
              System <span className="text-primary-light">Overview</span>
            </motion.h1>
          </div>

          <div className="flex flex-col md:flex-row gap-6 w-full lg:w-auto">
             <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text" 
                  placeholder="Global search..."
                  className="w-full lg:w-80 bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-primary/50 transition-all text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="flex bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                <TabButton active={activeTab === 'ops'} onClick={() => setActiveTab('ops')} icon={<MapIcon size={16}/>} label="Fleet Ops" />
                <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 size={16}/>} label="KPIs" />
                <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<History size={16}/>} label="Archive" />
                {user.role === 'admin' && <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={16}/>} label="Users" />}
             </div>
          </div>
        </div>

        <main className="flex-grow">
          <AnimatePresence mode="wait">
            
            {/* Fleet Operations View */}
            {activeTab === 'ops' && (
              <motion.div key="ops" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Live Tactical Map */}
                <div className="lg:col-span-4 space-y-8">
                   <div className="aspect-[4/5] bg-zinc-900/50 rounded-[3rem] border border-white/5 relative overflow-hidden group z-0">
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
                        {filteredReports.filter(r => r.latitude && r.longitude).map(r => (
                          <Marker key={r.id} position={[r.latitude!, r.longitude!]}>
                            <Popup className="text-ink">
                              <p className="font-bold text-sm">{r.title}</p>
                              <p className="text-[10px] opacity-60">{r.location}</p>
                              <div className="mt-2 flex items-center gap-2">
                                 <span className={`w-2 h-2 rounded-full ${r.priority === 'high' ? 'bg-red-500' : 'bg-primary'}`} />
                                 <span className="text-[9px] font-bold uppercase tracking-widest">{r.status}</span>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>

                      <div className="absolute bottom-8 left-8 right-8 p-6 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 z-[1000]">
                         <div className="flex justify-between items-center mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Unit Distribution</p>
                            <span className="flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                               <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest">Active</span>
                            </span>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <p className="text-[9px] opacity-40 uppercase tracking-widest mb-1">Personnel</p>
                               <p className="text-2xl font-serif">{rescuers.length.toString().padStart(2, '0')}</p>
                            </div>
                            <div>
                               <p className="text-[9px] opacity-40 uppercase tracking-widest mb-1">Critical</p>
                               <p className="text-2xl font-serif text-red-400">{filteredReports.filter(r => r.priority === 'high' && r.status !== 'resolved').length.toString().padStart(2, '0')}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Tactical Dispatch Queue */}
                <div className="lg:col-span-8 space-y-8">
                   <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                      <h2 className="text-xs font-bold uppercase tracking-[0.4em] opacity-30 flex items-center gap-4 flex-grow w-full md:w-auto">
                        Dispatch Queue
                        <div className="h-px flex-1 bg-white/5" />
                      </h2>
                      <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10 w-full md:w-auto">
                         <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="All" />
                         <FilterButton active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} label="Pending" />
                         <FilterButton active={statusFilter === 'verified'} onClick={() => setStatusFilter('verified')} label="Verified" />
                         <FilterButton active={statusFilter === 'assigned'} onClick={() => setStatusFilter('assigned')} label="Assigned" />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                      {filteredReports.filter(r => r.status !== 'resolved').map(report => (
                        <motion.div key={report.id} layout className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 hover:border-primary/30 transition-all group relative overflow-hidden">
                           
                           {/* Admin Power Controls */}
                           {user.role === 'admin' && (
                             <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => setEditingReport(report)} className="p-2 bg-white/5 rounded-lg hover:bg-primary hover:text-ink transition-all">
                                   <Edit2 size={14} />
                                </button>
                                <button onClick={() => deleteReport(report.id)} className="p-2 bg-white/5 rounded-lg hover:bg-red-500 transition-all">
                                   <Trash2 size={14} />
                                </button>
                             </div>
                           )}

                           <div className="flex justify-between items-start mb-6 pr-28">
                              <span className={`text-[9px] px-3 py-1 rounded-full border font-bold uppercase tracking-widest ${
                                report.priority === 'high' ? 'border-red-500/40 text-red-400 bg-red-500/10' : 'border-white/10 opacity-50'
                              }`}>
                                {report.priority}
                              </span>
                              <span className="text-[9px] px-3 py-1 bg-white/5 text-white/40 rounded-full border border-white/10 font-bold uppercase tracking-widest">
                                 {report.status}
                              </span>
                           </div>

                           <h3 className="text-2xl font-serif mb-2 group-hover:text-primary transition-colors">{report.title}</h3>
                           <p className="text-xs opacity-50 flex items-center gap-2 mb-6">
                              <MapPin size={12} className="text-primary" />
                              {report.location}
                           </p>

                           {report.image_url && (
                             <div className="aspect-video rounded-2xl overflow-hidden border border-white/5 mb-6 bg-black/40">
                                <img src={report.image_url} alt="Incident" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                             </div>
                           )}

                           <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                              {report.status === 'pending' && (
                                <>
                                  <button onClick={() => updateReport(report.id, { status: 'verified' })} className="flex-1 py-3 bg-primary text-ink text-[9px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all">
                                    Approve Report
                                  </button>
                                  <button onClick={() => updateReport(report.id, { status: 'rejected' })} className="flex-1 py-3 bg-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                    Reject
                                  </button>
                                </>
                              )}
                              {report.status === 'verified' && (
                                <button 
                                  onClick={() => setAssigningReportId(report.id)}
                                  className="flex-1 py-3 bg-primary text-ink text-[9px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
                                >
                                  Assign Rescuer
                                </button>
                              )}
                              {report.status === 'assigned' && (
                                <button className="flex-1 py-3 bg-white/5 text-white/40 text-[9px] font-bold uppercase tracking-widest rounded-xl cursor-not-allowed">
                                   Awaiting Field Acceptance
                                </button>
                              )}
                              {report.status === 'in-progress' && (
                                <button onClick={() => updateReport(report.id, { status: 'resolved' })} className="flex-1 py-3 bg-primary/20 text-primary text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-primary hover:text-ink transition-all">
                                  Finalize Resolution
                                </button>
                              )}
                           </div>
                        </motion.div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}

            {/* Analytics & KPIs View */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 <KpiCard label="Efficiency Rate" value={`${stats.rate}%`} sub="Overall Success" />
                 <KpiCard label="Response Needed" value={stats.pending.toString()} sub="Unverified Reports" />
                 <KpiCard label="Total Impact" value={stats.total.toString()} sub="Historical Incidents" />
                 <KpiCard label="Unit Capacity" value={rescuers.length.toString()} sub="Ready for Deployment" />
                 
                 <div className="lg:col-span-4 p-20 bg-white/5 rounded-[4rem] border border-white/10 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-8 border border-primary/20">
                       <BarChart3 size={32} />
                    </div>
                    <h3 className="text-4xl font-serif italic mb-4">Historical Data Analysis</h3>
                    <p className="text-paper/40 max-w-lg mx-auto font-light leading-relaxed">
                       Advanced predictive analytics and trend visualization are currently processing historical rescue patterns across Parañaque City.
                    </p>
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-12 w-full">
                       <StatMini label="Pending" val={stats.pending} color="text-yellow-400" />
                       <StatMini label="Verified" val={stats.verified} color="text-blue-400" />
                       <StatMini label="Active" val={stats.inProgress} color="text-primary" />
                       <StatMini label="Resolved" val={stats.resolved} color="text-paper" />
                    </div>
                 </div>
              </motion.div>
            )}

            {/* Archive / System Logs */}
            {activeTab === 'logs' && (
              <motion.div key="logs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 rounded-[3rem] border border-white/10 overflow-hidden">
                 <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="text-xs font-bold uppercase tracking-widest opacity-40">Historical Archive</h3>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">Total: {stats.resolved} Records</span>
                 </div>
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/30">
                        <th className="px-10 py-8 font-bold">Case ID</th>
                        <th className="px-10 py-8 font-bold">Incident Type</th>
                        <th className="px-10 py-8 font-bold">Location Area</th>
                        <th className="px-10 py-8 font-bold">Timestamp</th>
                        <th className="px-10 py-8 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {reports.filter(r => r.status === 'resolved').map(log => (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <td className="px-10 py-8 font-serif text-lg">#SSR-{log.id.toString().padStart(4, '0')}</td>
                          <td className="px-10 py-8 opacity-80">{log.animal_type || 'Unknown'} - {log.title}</td>
                          <td className="px-10 py-8 opacity-60 font-light">{log.location}</td>
                          <td className="px-10 py-8 opacity-30 text-[10px] font-bold uppercase">{new Date(log.created_at).toLocaleDateString()}</td>
                          <td className="px-10 py-8">
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => setEditingReport(log)} className="p-2 text-white/20 hover:text-primary transition-all">
                                   <ArrowUpRight size={16} />
                                </button>
                                <button onClick={() => deleteReport(log.id)} className="p-2 text-white/20 hover:text-red-500 transition-all">
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </motion.div>
            )}

            {/* Global User Management */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 rounded-[3rem] border border-white/10 overflow-hidden">
                 <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="text-xs font-bold uppercase tracking-widest opacity-40">Fleet & Personnel Registry</h3>
                    <div className="flex gap-4">
                       <span className="text-[10px] font-bold text-paper/40 uppercase tracking-widest">Admins: {allUsers.filter(u => u.role === 'admin').length}</span>
                       <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Personnel: {rescuers.length}</span>
                    </div>
                 </div>
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/30">
                        <th className="px-10 py-8 font-bold">Email Identity</th>
                        <th className="px-10 py-8 font-bold">Current Designation</th>
                        <th className="px-10 py-8 font-bold">Status</th>
                        <th className="px-10 py-8 font-bold">Access Control</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {allUsers.map(u => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-10 py-8 font-serif text-lg">{u.email}</td>
                          <td className="px-10 py-8">
                             <select 
                               value={u.role} 
                               onChange={(e) => updateUserRole(u.id, e.target.value)}
                               className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary/50 text-paper"
                             >
                                <option value="citizen">Citizen Account</option>
                                <option value="rescuer">Field Personnel</option>
                                <option value="admin">System Admin</option>
                             </select>
                          </td>
                          <td className="px-10 py-8">
                             <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2" />
                             <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Active</span>
                          </td>
                          <td className="px-10 py-8">
                             <button 
                               onClick={() => deleteUser(u.id)}
                               disabled={u.email === user.email}
                               className="text-white/20 hover:text-red-500 transition-colors disabled:opacity-0 p-2"
                             >
                                <Trash2 size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* Report Edit Modal */}
      <AnimatePresence>
        {editingReport && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingReport(null)} className="absolute inset-0 bg-ink/90 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
            >
               <div className="p-12">
                  <div className="flex justify-between items-start mb-10">
                     <h2 className="text-4xl font-serif italic text-paper">Modify <span className="text-primary">Incident</span></h2>
                     <button onClick={() => setEditingReport(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={24}/></button>
                  </div>
                  
                  <div className="space-y-8">
                     <div className="grid grid-cols-2 gap-8">
                        <ModalInput label="Status" value={editingReport.status} onChange={(v) => setEditingReport({...editingReport, status: v})} type="select" options={['pending', 'verified', 'assigned', 'in-progress', 'resolved', 'rejected']} />
                        <ModalInput label="Priority" value={editingReport.priority} onChange={(v) => setEditingReport({...editingReport, priority: v})} type="select" options={['low', 'medium', 'high']} />
                     </div>
                     <ModalInput label="Incident Title" value={editingReport.title} onChange={(v) => setEditingReport({...editingReport, title: v})} />
                     <ModalInput label="Detailed Description" value={editingReport.description} onChange={(v) => setEditingReport({...editingReport, description: v})} type="textarea" />
                     
                     <div className="pt-6 border-t border-white/5 flex gap-4">
                        <button onClick={() => updateReport(editingReport.id, editingReport)} className="flex-1 py-5 bg-primary text-ink font-bold uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] transition-all">Save Changes</button>
                        <button onClick={() => setEditingReport(null)} className="px-10 py-5 bg-white/5 text-paper font-bold uppercase tracking-widest text-xs rounded-2xl">Cancel</button>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rescuer Assignment Modal */}
      <AnimatePresence>
        {assigningReportId !== null && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setAssigningReportId(null); setRescuerSearch(''); }} className="absolute inset-0 bg-ink/90 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
            >
               <div className="p-12 flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-start mb-6">
                     <h2 className="text-4xl font-serif italic text-paper">Assign <span className="text-primary">Rescuer Unit</span></h2>
                     <button onClick={() => { setAssigningReportId(null); setRescuerSearch(''); }} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={24}/></button>
                  </div>

                  {/* Search and Sort controls */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                     <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input 
                          type="text" 
                          placeholder="Search rescuers..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-6 focus:outline-none focus:border-primary/50 transition-all text-sm text-paper"
                          value={rescuerSearch}
                          onChange={(e) => setRescuerSearch(e.target.value)}
                        />
                     </div>
                     <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start md:self-auto">
                        <button 
                          onClick={() => setRescuerSort('email')} 
                          className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${rescuerSort === 'email' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}
                        >
                          Email
                        </button>
                        <button 
                          onClick={() => setRescuerSort('id')} 
                          className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${rescuerSort === 'id' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}
                        >
                          ID
                        </button>
                     </div>
                  </div>

                  {/* Rescuers List */}
                  <div className="flex-grow overflow-y-auto pr-2 space-y-3 min-h-[200px] max-h-[40vh]">
                     {filteredRescuers.length === 0 ? (
                        <p className="text-center py-10 text-white/30 italic text-sm">No rescuers found matching query.</p>
                     ) : (
                        filteredRescuers.map(r => (
                           <button 
                             key={r.id} 
                             onClick={() => {
                               updateReport(assigningReportId, { status: 'assigned', assigned_to: r.id });
                               setAssigningReportId(null);
                               setRescuerSearch('');
                             }}
                             className="w-full p-4 bg-white/5 rounded-xl border border-white/10 hover:border-primary/50 hover:bg-white/[0.08] transition-all text-left flex justify-between items-center group/item"
                           >
                              <div>
                                 <p className="text-base font-serif text-paper group-hover/item:text-primary transition-colors">{r.email}</p>
                                 <p className="text-[9px] uppercase tracking-widest text-white/40 mt-1">ID: {r.id} • Field Personnel</p>
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover/item:opacity-100 transition-opacity">Select & Assign →</span>
                           </button>
                        ))
                     )}
                  </div>
                  
                  <div className="pt-6 border-t border-white/5 flex justify-end mt-6">
                     <button onClick={() => { setAssigningReportId(null); setRescuerSearch(''); }} className="px-10 py-4 bg-white/5 text-paper font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-colors">Close</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

function KpiCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/10">
       <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-4">{label}</p>
       <h4 className="text-5xl font-serif italic mb-2">{value}</h4>
       <p className="text-[10px] opacity-30 uppercase tracking-widest">{sub}</p>
    </div>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${active ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}>
       {label}
    </button>
  );
}

function StatMini({ label, val, color }: { label: string, val: number, color: string }) {
  return (
    <div>
       <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2">{label}</p>
       <p className={`text-3xl font-serif ${color}`}>{val.toString().padStart(2, '0')}</p>
    </div>
  );
}

function ModalInput({ label, value, onChange, type = 'text', options = [] }: { label: string, value: string, onChange: (v: string) => void, type?: 'text' | 'textarea' | 'select', options?: string[] }) {
  return (
    <div className="space-y-2">
       <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">{label}</label>
       {type === 'text' && <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-paper focus:border-primary/50 outline-none" />}
       {type === 'textarea' && <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-paper focus:border-primary/50 outline-none resize-none" />}
       {type === 'select' && (
         <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-paper focus:border-primary/50 outline-none uppercase text-xs font-bold tracking-widest">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
         </select>
       )}
    </div>
  );
}
