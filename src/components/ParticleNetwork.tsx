import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import anime from 'animejs';
import { Dog, Bone, RadioReceiver } from 'lucide-react';
import { useScroll } from 'motion/react';

export default function ParticleNetwork() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const uiRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Expose switching logic to React state
  const targetFormationRef = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // --- THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    // Using our Natural Tones Paper Alt color for background
    scene.background = new THREE.Color(0xF0EDE6); 
    
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 16);
    
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // --- PARTICLES SETUP ---
    const PARTICLE_COUNT = 450;
    const posArr = new Float32Array(PARTICLE_COUNT * 3);
    const homeArr = new Float32Array(PARTICLE_COUNT * 3);
    const velArr = new Float32Array(PARTICLE_COUNT * 3);

    // Generating initial scattered (raw data) positions
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const hx = (Math.random() - 0.5) * 40;
        const hy = (Math.random() - 0.5) * 20;
        const hz = (Math.random() - 0.5) * 8;
        posArr[i*3] = hx; posArr[i*3+1] = hy; posArr[i*3+2] = hz;
        homeArr[i*3] = hx; homeArr[i*3+1] = hy; homeArr[i*3+2] = hz;
        velArr[i*3] = (Math.random() - 0.5) * 0.005;
        velArr[i*3+1] = (Math.random() - 0.5) * 0.005;
        velArr[i*3+2] = (Math.random() - 0.5) * 0.002;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    
    // We use dark ink colors for the particles before post-processing
    const pMat = new THREE.PointsMaterial({ 
        color: 0x3C2A21, 
        size: 2.0, 
        sizeAttenuation: true, 
        transparent: true, 
        opacity: 0.8 
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // --- CONNECTING LINES (PLEXUS) ---
    const lineGeo = new THREE.BufferGeometry();
    const MAX_LINES = 800;
    const linePos = new Float32Array(MAX_LINES * 6);
    const lineColors = new Float32Array(MAX_LINES * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    
    const lineMat = new THREE.LineBasicMaterial({ 
        vertexColors: true, 
        transparent: true, 
        opacity: 0.3 
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // --- DOT MATRIX SHADER SETUP ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    const dotMatrixShader = {
      uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        uDotSize: { value: 4.0 },
        uDotGap: { value: 2.0 },
        uBrightness: { value: 1.2 },
        uContrast: { value: 0.8 },
        uBgColor: { value: new THREE.Vector3(240/255, 237/255, 230/255) }, // #F0EDE6 Theme Background
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        precision highp float;
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uDotSize, uDotGap, uBrightness, uContrast;
        uniform vec3 uBgColor;
        varying vec2 vUv;
        void main() {
          vec2 px = vUv * uResolution;
          float sp = uDotSize + uDotGap;
          vec2 cell = floor(px / sp);
          vec2 center = (cell + 0.5) * sp;
          vec2 sUV = center / uResolution;
          
          vec3 c = texture2D(tDiffuse, sUV).rgb;
          
          // Note: our background is now light, so objects are darker
          // We invert the luminosity calculation so dark objects become high density dots
          float rawLum = dot(c, vec3(0.299, 0.587, 0.114));
          // Invert: 0 is dark (object), 1 is light (bg)
          float targetLum = (1.0 - rawLum) * uBrightness; 
          targetLum = clamp((targetLum - 0.5) / uContrast + 0.5, 0.0, 1.0);
          
          if (targetLum < 0.05) { gl_FragColor = vec4(uBgColor, 1.0); return; }
          
          float maxR = uDotSize * 0.5;
          float r = mix(0.1, maxR, pow(targetLum, uContrast));
          float d = length(px - center);
          float mask = 1.0 - smoothstep(r - 0.5, r + 0.5, d);
          
          // Theme ink color (3C2A21) and primary green (7D9D85)
          vec3 inkCol = vec3(60.0/255.0, 42.0/255.0, 33.0/255.0);
          vec3 primaryCol = vec3(125.0/255.0, 157.0/255.0, 133.0/255.0);
          vec3 dotCol = mix(primaryCol, inkCol, targetLum);
          
          gl_FragColor = vec4(mix(uBgColor, dotCol, mask), 1.0);
        }
      `
    };
    
    const dotPass = new ShaderPass(dotMatrixShader);
    composer.addPass(dotPass);
    composer.addPass(new OutputPass());

    // --- FORMATIONS ---
    const fBone = new Float32Array(PARTICLE_COUNT * 3);
    const fPaw = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Bone structure
        let bx, by, bz;
        const bType = i % 5;
        if (bType < 2) { 
            // shaft
            bx = (Math.random() - 0.5) * 14; by = (Math.random() - 0.5) * 3;
        } else if (bType === 2) { // left top
            let a = Math.random() * Math.PI*2, r = Math.random() * 2.5;
            bx = -7 + Math.cos(a)*r; by = 2 + Math.sin(a)*r;
        } else if (bType === 3) { // left bottom
            let a = Math.random() * Math.PI*2, r = Math.random() * 2.5;
            bx = -7 + Math.cos(a)*r; by = -2 + Math.sin(a)*r;
        } else { // right bulbs
            let a = Math.random() * Math.PI*2, r = Math.random() * 2.5;
            bx = 7 + Math.cos(a)*r;  by = (i%2===0?2:-2) + Math.sin(a)*r;
        }
        bz = (Math.random() - 0.5) * 3;
        fBone[i*3] = bx; fBone[i*3+1] = by; fBone[i*3+2] = bz;

        // Paw structure
        let px, py, pz;
        const pType = i % 6;
        if (pType < 3) {
            // Main pad
            let a = Math.random() * Math.PI*2, r = Math.random() * 5;
            px = Math.cos(a)*r; py = -2 + Math.sin(a)*r * 0.8;
        } else {
            // 4 toe pads
            const angles = [-0.8, -0.3, 0.3, 0.8];
            const aCenter = angles[i % 4];
            const dist = 6.5;
            const cx = Math.sin(aCenter) * dist;
            const cy = -2 + Math.cos(aCenter) * dist;
            let a = Math.random() * Math.PI*2, r = Math.random() * 1.8;
            px = cx + Math.cos(a)*r * (1 + Math.abs(aCenter)*0.5); 
            py = cy + Math.sin(a)*r * 1.3;
        }
        pz = (Math.random() - 0.5) * 2;
        fPaw[i*3] = px; fPaw[i*3+1] = py; fPaw[i*3+2] = pz;
    }

    const formations = [null, fBone, fPaw];
    
    // Smooth transitions
    let formationBlend = 0;
    let activeFormationIdx = 0;

    // --- MOUSE PHYSICS ---
    const mouse = new THREE.Vector2(9999, 9999);
    const mouseWorld = new THREE.Vector3(9999, 9999, 0);
    let mouseActive = false;
    const raycaster = new THREE.Raycaster();
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(mousePlane, target);
      mouseWorld.copy(target);
      mouseActive = true;
    };
    
    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('touchmove', onPointerMove as EventListener, { passive: true });
    container.addEventListener('mouseleave', () => { mouseActive = false; mouseWorld.set(9999, 9999, 0); });

    // --- ANIMATION LOOP ---
    const MOUSE_RADIUS = 6.0;
    const MOUSE_STRENGTH = 0.25;
    const SPRING_STRENGTH = 0.015;
    const SPRING_DAMPING = 0.88;
    
    let rafId: number;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      
      const t = performance.now();
      const pos = pGeo.attributes.position.array as Float32Array;
      
      // Update targeted formation processing
      const targetForm = targetFormationRef.current;
      if (targetForm > 0) {
        formationBlend = Math.min(formationBlend + 0.03, 1.0);
        activeFormationIdx = targetForm;
      } else {
        formationBlend = Math.max(formationBlend - 0.03, 0.0);
        if (formationBlend <= 0) activeFormationIdx = 0;
      }

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
        
        let targetX, targetY, targetZ;
        if (activeFormationIdx > 0 && formationBlend > 0) {
          const f = formations[activeFormationIdx]!;
          targetX = homeArr[ix] + (f[ix] - homeArr[ix]) * formationBlend;
          targetY = homeArr[iy] + (f[iy] - homeArr[iy]) * formationBlend;
          targetZ = homeArr[iz] + (f[iz] - homeArr[iz]) * formationBlend;
        } else {
          targetX = homeArr[ix]; targetY = homeArr[iy]; targetZ = homeArr[iz];
        }

        // Mouse repulsion
        if (mouseActive) {
          const dx = pos[ix] - mouseWorld.x;
          const dy = pos[iy] - mouseWorld.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < MOUSE_RADIUS && dist > 0.1) {
            const force = MOUSE_STRENGTH * Math.pow(1.0 - dist / MOUSE_RADIUS, 2);
            velArr[ix] += (dx / dist) * force;
            velArr[iy] += (dy / dist) * force;
          }
        }

        // Spring force towards target
        velArr[ix] += (targetX - pos[ix]) * SPRING_STRENGTH;
        velArr[iy] += (targetY - pos[iy]) * SPRING_STRENGTH;
        velArr[iz] += (targetZ - pos[iz]) * SPRING_STRENGTH;

        // Damping
        velArr[ix] *= SPRING_DAMPING; velArr[iy] *= SPRING_DAMPING; velArr[iz] *= SPRING_DAMPING;

        // Slow chaotic drift when scattered
        if (formationBlend < 0.5) {
          homeArr[ix] += Math.sin(i * 0.73 + t * 0.0003) * 0.005;
          homeArr[iy] += Math.cos(i * 1.17 + t * 0.00025) * 0.004;
          if (Math.abs(homeArr[ix]) > 20) homeArr[ix] *= 0.99;
          if (Math.abs(homeArr[iy]) > 10) homeArr[iy] *= 0.99;
        }

        pos[ix] += velArr[ix]; pos[iy] += velArr[iy]; pos[iz] += velArr[iz];
      }
      pGeo.attributes.position.needsUpdate = true;

      // --- Update connection lines based on proximity ---
      let li = 0;
      const baseThreshold = 3.5 - formationBlend * 1.0; 
      
      for (let i = 0; i < PARTICLE_COUNT && li < MAX_LINES; i++) {
        for (let j = i + 1; j < PARTICLE_COUNT && li < MAX_LINES; j++) {
          const dx = pos[i*3] - pos[j*3];
          const dy = pos[i*3+1] - pos[j*3+1];
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          let threshold = baseThreshold;
          
          if (dist < threshold) {
            const alpha = 1.0 - dist / threshold;
            const idx = li * 6;
            linePos[idx] = pos[i*3];     linePos[idx+1] = pos[i*3+1]; linePos[idx+2] = pos[i*3+2];
            linePos[idx+3] = pos[j*3];   linePos[idx+4] = pos[j*3+1]; linePos[idx+5] = pos[j*3+2];
            
            // Set line color (normalized RGB of ink/primary)
            const cR = 60/255, cG = 42/255, cB = 33/255;
            lineColors[idx] = cR*alpha;   lineColors[idx+1] = cG*alpha; lineColors[idx+2] = cB*alpha;
            lineColors[idx+3] = cR*alpha; lineColors[idx+4] = cG*alpha; lineColors[idx+5] = cB*alpha;
            li++;
          }
        }
      }
      for (let i = li*6; i < MAX_LINES*6; i++) { linePos[i] = 0; lineColors[i] = 0; }
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.color.needsUpdate = true;
      lineGeo.setDrawRange(0, li * 2);

      composer.render();
    };

    animate();

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
      dotPass.uniforms.uResolution.value.set(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Initial entrance animation via anime.js
    anime({
      targets: container,
      opacity: [0, 1],
      duration: 1500,
      easing: 'easeInOutQuad'
    });

    if (uiRef.current) {
        anime({
            targets: uiRef.current.children,
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(150),
            duration: 800,
            easing: 'easeOutExpo'
        });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
      container.removeChild(renderer.domElement);
      pGeo.dispose(); pMat.dispose();
      lineGeo.dispose(); lineMat.dispose();
      renderer.dispose();
      composer.dispose();
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      if (latest < 0.33) {
        if (targetFormationRef.current !== 0) {
          targetFormationRef.current = 0;
          setActiveTab(0);
        }
      } else if (latest < 0.66) {
        if (targetFormationRef.current !== 1) {
          targetFormationRef.current = 1;
          setActiveTab(1);
        }
      } else {
        if (targetFormationRef.current !== 2) {
          targetFormationRef.current = 2;
          setActiveTab(2);
        }
      }
    });
  }, [scrollYProgress]);

  return (
    <section ref={sectionRef} className="relative w-full h-[300vh] bg-paper-alt border-y border-border">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* 3D Canvas Container */}
        <div 
          ref={mountRef} 
          className="absolute inset-0 cursor-crosshair opacity-0"
        />
        
        <div className="absolute inset-x-0 bottom-10 z-10 flex justify-center pointer-events-none px-6">
          <div ref={uiRef} className="flex gap-4 p-2 bg-white/70 backdrop-blur-md rounded-2xl border border-border shadow-sm">
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-all ${
                activeTab === 0 ? 'bg-ink text-white shadow-md' : 'text-ink-muted/50'
              }`}>
              <RadioReceiver size={18} />
              <span className="hidden sm:inline">Sensor Feed</span>
            </div>

            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-all ${
                activeTab === 1 ? 'bg-primary text-white shadow-md' : 'text-ink-muted/50'
              }`}>
              <Bone size={18} />
              <span className="hidden sm:inline">Vitals</span>
            </div>

            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-all ${
                activeTab === 2 ? 'bg-primary-dark text-white shadow-md' : 'text-ink-muted/50'
              }`}>
              <Dog size={18} />
              <span className="hidden sm:inline">Entity ID</span>
            </div>
          </div>
        </div>
        </div>
        </section>

  );
}
