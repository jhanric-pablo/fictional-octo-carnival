import React from 'react';
import Navbar from '../components/Navbar';
import CustomCursor from '../components/CustomCursor';
import { API_URL } from '../config';

export default function Impact() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-ink">
      <CustomCursor />
      <Navbar dark />
      
      {/* Cinematic Background under iframe */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full" />
      </div>
      <iframe 
        src="/lab-copy/index.html" 
        className="w-full h-full border-none"
        title="3D Image Split Reference"
        loading="lazy"
        allow="autoplay; fullscreen; pointer-lock"
      />
      
      {/* 
        Overlaying the Navbar and Cursor on top of the iframe 
        might require some adjustments to pointer-events, 
        but serving the actual code is the most "perfect" way 
        to capture the animations.
      */}
    </div>
  );
}
