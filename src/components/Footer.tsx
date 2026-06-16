import { Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-white border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16 border-b border-border pb-16">
        
        {/* Brand */}
        <div className="lg:col-span-2">
          <a href="#" className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-black/10">
              <img src="/images/logo.svg" alt="SSR Logo" className="w-full h-full object-cover scale-[1.5]" />
            </div>
            <span className="font-sans font-bold text-lg leading-none tracking-tight uppercase text-ink">Smart Stray</span>
          </a>
          <p className="text-ink-muted text-sm max-w-sm leading-relaxed mb-8">
            A real-time reporting and rescue management system dedicated to minimizing animal suffering and maximizing community action in Parañaque City.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-ink hover:text-primary hover:border-primary transition-colors">
              <Facebook size={16} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-ink hover:text-primary hover:border-primary transition-colors">
              <Instagram size={16} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-ink hover:text-primary hover:border-primary transition-colors">
              <Twitter size={16} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold uppercase tracking-widest text-[#9E928A] text-[11px] mb-6">Quick Links</h4>
          <ul className="space-y-4 text-sm text-ink-muted font-medium">
            <li><a href="#mission" className="hover:text-primary transition-colors">Our Mission</a></li>
            <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
            <li><a href="#faqs" className="hover:text-primary transition-colors">FAQs</a></li>
            <li><a href="#report" className="hover:text-primary transition-colors">Report an Incident</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-bold uppercase tracking-widest text-[#9E928A] text-[11px] mb-6">Contact Us</h4>
          <ul className="space-y-4 text-sm text-ink-muted font-medium">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
              <span>Parañaque City Hall, San Antonio Valley 1,<br />Parañaque City, Metro Manila</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-primary shrink-0" />
              <a href="mailto:rescue@paranaquepets.gov.ph" className="hover:text-primary transition-colors">rescue@paranaquepets.gov.ph</a>
            </li>
            <li className="flex items-center gap-3 mt-4">
               <div className="px-3 py-1.5 rounded-lg bg-paper-alt text-ink font-bold text-[11px] uppercase tracking-widest border border-border">
                 Emergency Hotline: 911
               </div>
            </li>
          </ul>
        </div>

      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#9E928A]">
        <p>&copy; {new Date().getFullYear()} Parañaque City Smart Governance.</p>
        <div className="flex gap-10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            System Status: Operational
          </div>
          <div className="hidden sm:flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
