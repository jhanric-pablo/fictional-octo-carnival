import { useEffect, useState } from 'react';
import { motion, useSpring } from 'motion/react';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Smooth springs for the cursor
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent | { clientX: number, clientY: number }) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX - 16); 
      cursorY.set(e.clientY - 16);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'mousemove') {
        const { clientX, clientY } = event.data;
        updateMousePosition({ clientX, clientY });
      } else if (event.data && event.data.type === 'hover') {
        setIsHovering(event.data.value);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('message', handleMessage);
    };
  }, [cursorX, cursorY]);

  // Hide default cursor on desktop, disable on touch devices
  if (typeof window !== 'undefined' && 'ontouchstart' in window) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        * { cursor: none !important; }
      `}} />
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          backgroundColor: 'white',
        }}
        animate={{
          scale: isHovering ? 2.5 : 1,
          backgroundColor: isHovering ? '#F9F8F6' : '#FFFFFF', // slightly offwhite on hover
        }}
        transition={{ type: 'spring', ...springConfig }}
      >
        <motion.div 
          className="absolute inset-0 flex items-center justify-center text-[5px] text-ink font-bold uppercase tracking-widest opacity-0"
          animate={{ opacity: isHovering ? 1 : 0 }}
        >
          {isHovering ? "Click" : ""}
        </motion.div>
      </motion.div>
      
      {/* Tiny dot that follows exactly */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[10000] mix-blend-difference"
        animate={{
          x: mousePosition.x - 3,
          y: mousePosition.y - 3,
          opacity: isHovering ? 0 : 1
        }}
        transition={{ type: 'tween', ease: 'linear', duration: 0 }}
      />
    </>
  );
}
