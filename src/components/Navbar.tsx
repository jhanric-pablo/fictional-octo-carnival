import { LogIn, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, useScroll, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  dark?: boolean;
}

export default function Navbar({ dark = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  const guestLinks = [
    { name: 'Mission', href: '/#mission' },
    { name: 'Track Ops', href: '/track' },
    { name: 'Our Impact', href: '/impact' },
    { name: 'Report Incident', href: '/report-portal' },
  ];

  const citizenLinks = [
    { name: 'Impact', href: '/impact' },
    { name: 'Track', href: '/track' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Report Incident', href: '/report-portal' },
  ];

  const adminLinks = [
    { name: 'Track', href: '/track' },
    { name: 'Impact', href: '/impact' },
    { name: 'Operations', href: '/dashboard?tab=ops' },
    { name: 'Users', href: '/dashboard?tab=users' },
    { name: 'Report Entry', href: '/report-portal' },
  ];

  const navLinks = !user ? guestLinks : (user.role === 'admin' || user.role === 'rescuer' ? adminLinks : citizenLinks);

  const headerColors = dark 
    ? (isScrolled ? 'bg-ink/80 backdrop-blur-xl text-paper shadow-2xl' : 'bg-transparent text-paper')
    : (isScrolled ? 'bg-paper/70 backdrop-blur-xl text-ink shadow-sm' : 'bg-paper text-ink');

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 w-full z-50 pointer-events-none transition-all duration-500 ${headerColors}`}
    >
      <div className={`max-w-[90rem] mx-auto px-6 lg:px-12 flex items-center justify-between transition-all duration-500 ${isScrolled ? 'h-20' : 'h-24'}`}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group pointer-events-auto">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm border border-black/10 transition-all duration-300 group-hover:scale-105">
            <img src="/images/logo.svg" alt="Smart Stray Logo" className="w-full h-full object-cover scale-[1.5]" />
          </div>
          <div className="flex flex-col justify-center text-current">
            <span className="font-sans font-bold text-sm tracking-widest uppercase">Smart Stray</span>
            <span className="text-[9px] font-medium tracking-[0.2em] opacity-60 uppercase mt-0.5">Parañaque City Division</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10 pointer-events-auto">
          {navLinks.map((link) => (
            link.href.startsWith('/#') ? (
               <a 
                 key={link.name} 
                 href={isHome ? link.href.substring(1) : link.href}
                 className="text-[11px] font-bold uppercase tracking-widest hover:opacity-50 transition-opacity"
               >
                 {link.name}
               </a>
            ) : (
               <Link 
                 key={link.name} 
                 to={link.href}
                 className="text-[11px] font-bold uppercase tracking-widest hover:opacity-50 transition-opacity flex items-center gap-2"
               >
                 {link.name}
               </Link>
            )
          ))}
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">{user.email.split('@')[0]} ({user.role})</span>
              <button 
                onClick={handleLogout}
                className={`px-6 py-3 rounded-full border text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${
                  dark ? 'border-paper text-paper hover:bg-paper hover:text-ink' : 'border-ink text-ink hover:bg-ink hover:text-white'
                }`}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <Link 
              to="/auth"
              className={`px-6 py-3 rounded-full border text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${
                dark ? 'border-paper text-paper hover:bg-paper hover:text-ink' : 'border-ink text-ink hover:bg-ink hover:text-white'
              }`}
            >
              <LogIn size={14} />
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 -mr-2 pointer-events-auto transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden absolute left-0 w-full py-8 px-6 flex flex-col gap-6 pointer-events-auto border-t border-current/10 shadow-xl ${
              dark ? 'bg-ink text-paper' : 'bg-paper text-ink'
            } ${isScrolled ? 'top-20' : 'top-24'}`}
          >
            {navLinks.map((link) => (
               link.href.startsWith('/#') ? (
                <a 
                  key={link.name} 
                  href={isHome ? link.href.substring(1) : link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-2xl font-serif font-medium border-b border-current/10 pb-4"
                >
                  {link.name}
                </a>
               ) : (
                <Link 
                  key={link.name} 
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-2xl font-serif font-medium border-b border-current/10 pb-4 flex items-center gap-4"
                >
                  {link.name}
                </Link>
               )
            ))}
            {user ? (
              <button 
                onClick={() => { handleLogout(); setIsOpen(false); }}
                className="w-full py-4 rounded-full border border-current text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mt-4"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <Link 
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="w-full py-4 rounded-full border border-current text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mt-4"
              >
                <LogIn size={16} />
                Login
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
