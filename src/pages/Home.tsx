import React, { useEffect } from 'react';
import Lenis from 'lenis';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Mission from '../components/Mission';
import ParticleNetwork from '../components/ParticleNetwork';
import TechExplain from '../components/TechExplain';
import Features from '../components/Features';
import ReportSection from '../components/ReportSection';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-paper text-ink">
      <CustomCursor />
      <Navbar />
      <main className="flex-grow selection:bg-primary/30 selection:text-ink">
        <Hero />
        <Mission />
        <ParticleNetwork />
        <TechExplain />
        <Features />
        <ReportSection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
