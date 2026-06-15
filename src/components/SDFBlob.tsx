import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export default function SDFBlob() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // ============ QUALITY SETTINGS ============
    const quality = { pixelRatio: 1.25, marchSteps: 64, aoSteps: 3, dotSize: 5.0, dotGap: 2.5, scanlines: 0.75, bloomEnabled: true };
    const settings = {
      dither: { enabled: true, dotSize: quality.dotSize, dotGap: quality.dotGap, brightness: 0.85, contrast: 0.60, threshold: 0.03, dotColor: [125/255, 157/255, 133/255], bgColor: [253/255, 251/255, 247/255] },
      crosshatch: { enabled: false, intensity: 0.95, angle: 0.4363 },
      bloom: { enabled: quality.bloomEnabled, intensity: 0.55, size: 1.50 },
      crt: { enabled: true, curvature: 0.0, scanlines: quality.scanlines, vignette: 2.00, chroma: 0.0 },
      scene: { gooeyness: 1.20, speed: 0.85 }
    };

    // ============ MOUSE TRACKING ============
    const mouse = new THREE.Vector2(0, 0);
    let mouseInScene = false;
    let mousePressed = false;
    let mouseSphereRadius = 0.0;
    const mouseSphereTargetRadius = 0.55;
    const mouseSphereClickRadius = 0.95;
    const mouseWorld = new THREE.Vector3(0, 0, 0);
    const mouseWorldTarget = new THREE.Vector3(0, 0, 0);
    const mouseDamping = 0.15;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      mouseInScene = true;
      const rect = container.getBoundingClientRect();
      const clientX = 'touches' in e && e.touches[0] ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e && e.touches[0] ? e.touches[0].clientY : (e as MouseEvent).clientY;
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };
    
    container.addEventListener('mousemove', onPointerMove, { passive: true });
    container.addEventListener('touchmove', onPointerMove, { passive: true });
    container.addEventListener('mouseenter', () => { mouseInScene = true; }, { passive: true });
    container.addEventListener('mouseleave', () => { mouseInScene = false; }, { passive: true });
    container.addEventListener('mousedown', () => { mousePressed = true; }, { passive: true });
    container.addEventListener('mouseup', () => { mousePressed = false; }, { passive: true });
    container.addEventListener('touchstart', (e) => { mouseInScene = true; mousePressed = true; onPointerMove(e); }, { passive: true });
    container.addEventListener('touchend', () => { mousePressed = false; mouseInScene = false; }, { passive: true });

    // ============ THREE.JS SETUP ============
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFDFBF7);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5);
    
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.enabled = false;

    // ============ RAYMARCHING QUAD ============
    const quadGeometry = new THREE.PlaneGeometry(2, 2);
    const quadMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        uCameraPos: { value: camera.position.clone() },
        uCameraTarget: { value: new THREE.Vector3(0, 0, 0) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
        uGooeyness: { value: settings.scene.gooeyness },
        uSpeed: { value: settings.scene.speed },
        uMouseSpherePos: { value: new THREE.Vector3(0, 0, 0) },
        uMouseSphereRadius: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        #define MARCH_STEPS ${quality.marchSteps}
        #define AO_STEPS ${quality.aoSteps}
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec3 uCameraPos;
        uniform vec3 uCameraTarget;
        uniform float uPixelRatio;
        uniform float uGooeyness;
        uniform float uSpeed;
        uniform vec3 uMouseSpherePos;
        uniform float uMouseSphereRadius;

        varying vec2 vUv;

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float sdSphere(vec3 p, vec3 center, float radius) {
          return length(p - center) - radius;
        }

        float sceneCompound(vec3 p, float t, float k) {
          // Two large primary blobs
          float angle1 = t * 0.5;
          float angle2 = t * 0.5 + 3.14159;
          vec3 c1 = vec3(
            cos(angle1) * 2.4 + sin(t * 0.25) * 0.3,
            sin(angle1 * 0.6) * 0.8 + cos(t * 0.4) * 0.2,
            sin(angle1 * 0.35) * 0.6
          );
          vec3 c2 = vec3(
            cos(angle2) * 2.4 + sin(t * 0.3) * 0.3,
            sin(angle2 * 0.6) * 0.8 - cos(t * 0.35) * 0.2,
            sin(angle2 * 0.35) * 0.6
          );
          float s1 = sdSphere(p, c1, 1.2 + 0.07 * sin(t * 2.5));
          float s2 = sdSphere(p, c2, 1.05 + 0.07 * cos(t * 2.0));

          // Medium satellites
          vec3 c3 = c1 + vec3(sin(t * 1.8) * 0.9, cos(t * 2.2) * 0.9, sin(t * 1.5) * 0.6);
          vec3 c4 = c2 + vec3(-cos(t * 1.5) * 0.8, sin(t * 1.9) * 0.8, -cos(t * 1.7) * 0.5);
          float s3 = sdSphere(p, c3, 0.55);
          float s4 = sdSphere(p, c4, 0.5);

          // Free-floating blobs
          vec3 c5 = vec3(sin(t * 0.7) * 3.0, cos(t * 0.55) * 1.2, cos(t * 0.45) * 0.7);
          vec3 c6 = vec3(-cos(t * 0.65) * 2.8, sin(t * 0.75) * 1.0, sin(t * 0.5) * 0.8);
          float s5 = sdSphere(p, c5, 0.6);
          float s6 = sdSphere(p, c6, 0.55);

          float d = smin(s1, s2, k);
          d = smin(d, s3, k * 0.7);
          d = smin(d, s4, k * 0.7);
          d = smin(d, s5, k * 0.8);
          d = smin(d, s6, k * 0.8);
          return d;
        }

        float sceneSDF(vec3 p) {
          float t = uTime * uSpeed;
          float k = uGooeyness;
          float d = sceneCompound(p, t, k);
          if (uMouseSphereRadius > 0.001) {
            float ms = sdSphere(p, uMouseSpherePos, uMouseSphereRadius);
            d = smin(d, ms, k * 0.8);
          }
          return d;
        }

        vec3 calcNormal(vec3 p) {
          const float eps = 0.001;
          vec2 h = vec2(eps, 0.0);
          return normalize(vec3(
            sceneSDF(p + h.xyy) - sceneSDF(p - h.xyy),
            sceneSDF(p + h.yxy) - sceneSDF(p - h.yxy),
            sceneSDF(p + h.yyx) - sceneSDF(p - h.yyx)
          ));
        }

        float calcAO(vec3 pos, vec3 nor) {
          float occ = 0.0;
          float sca = 1.0;
          for (int i = 0; i < AO_STEPS; i++) {
            float h = 0.02 + 0.15 * float(i);
            float d = sceneSDF(pos + h * nor);
            occ += (h - d) * sca;
            sca *= 0.9;
          }
          return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }

        float fresnel(vec3 viewDir, vec3 normal, float power) {
          return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
        }

        // Fake directional shadow via downward AO probe
        float cheapShadow(vec3 pos, vec3 lightDir) {
          float d1 = sceneSDF(pos + lightDir * 0.15);
          float d2 = sceneSDF(pos + lightDir * 0.4);
          float d3 = sceneSDF(pos + lightDir * 0.8);
          return clamp(0.3 + 0.7 * smoothstep(0.0, 0.3, min(min(d1, d2), d3)), 0.0, 1.0);
        }

        mat3 setCamera(vec3 ro, vec3 ta, float cr) {
          vec3 cw = normalize(ta - ro);
          vec3 cp = vec3(sin(cr), cos(cr), 0.0);
          vec3 cu = normalize(cross(cw, cp));
          vec3 cv = normalize(cross(cu, cw));
          return mat3(cu, cv, cw);
        }

        void main() {
          vec2 fragCoord = vUv * uResolution;
          vec2 uv = (2.0 * fragCoord - uResolution) / uResolution.y;
          vec3 ro = uCameraPos;
          vec3 ta = uCameraTarget;
          mat3 ca = setCamera(ro, ta, 0.0);
          vec3 rd = ca * normalize(vec3(uv, 1.8));
          float t = 0.0;
          float d;
          vec3 p;
          bool hit = false;
          for (int i = 0; i < MARCH_STEPS; i++) {
            p = ro + rd * t;
            d = sceneSDF(p);
            if (d < 0.002) { hit = true; break; }
            t += d * 0.9;
            if (t > 15.0) break;
          }
          
          vec3 col = vec3(0.99, 0.98, 0.96); // Paper background
          col -= vec3(0.03, 0.01, 0.06) * (1.0 - uv.y * 0.5);
          
          if (hit) {
            vec3 nor = calcNormal(p);
            vec3 viewDir = normalize(ro - p);
            vec3 lightPos1 = vec3(3.0, 4.0, 5.0);
            vec3 lightPos2 = vec3(-4.0, 2.0, -3.0);
            vec3 lightDir1 = normalize(lightPos1 - p);
            vec3 lightDir2 = normalize(lightPos2 - p);
            float diff1 = max(dot(nor, lightDir1), 0.0);
            float diff2 = max(dot(nor, lightDir2), 0.0);
            vec3 halfDir1 = normalize(lightDir1 + viewDir);
            vec3 halfDir2 = normalize(lightDir2 + viewDir);
            float spec1 = pow(max(dot(nor, halfDir1), 0.0), 64.0);
            float spec2 = pow(max(dot(nor, halfDir2), 0.0), 32.0);
            float sha1 = cheapShadow(p + nor * 0.01, lightDir1);
            float sha2 = cheapShadow(p + nor * 0.01, lightDir2);
            float ao = calcAO(p, nor);
            float fres = fresnel(viewDir, nor, 3.0);
            float sss = max(0.0, dot(viewDir, -lightDir1)) * 0.3;
            
            vec3 baseColor1 = vec3(125.0/255.0, 157.0/255.0, 133.0/255.0); // Primary green
            vec3 baseColor2 = vec3(60.0/255.0, 42.0/255.0, 33.0/255.0); // Ink brown
            vec3 baseColor3 = vec3(1.0, 0.5, 0.2); // Orange accent
            
            float colorMix = sin(p.x * 1.5 + uTime * 0.5) * 0.5 + 0.5;
            float colorMix2 = cos(p.y * 2.0 - uTime * 0.3) * 0.5 + 0.5;
            vec3 baseColor = mix(baseColor1, baseColor2, colorMix);
            baseColor = mix(baseColor, baseColor3, colorMix2 * 0.3);
            
            vec3 diffuse = baseColor * (diff1 * sha1 * vec3(1.0, 0.95, 0.9) * 0.8 + diff2 * sha2 * vec3(0.4, 0.5, 0.9) * 0.4);
            vec3 specular = vec3(1.0, 0.95, 0.9) * spec1 * sha1 * 0.7 + vec3(0.5, 0.6, 1.0) * spec2 * sha2 * 0.3;
            vec3 ambient = baseColor * vec3(0.4, 0.4, 0.4) * ao;
            vec3 rim = mix(vec3(0.4, 0.6, 1.0), vec3(1.0, 0.4, 0.6), colorMix) * fres * 0.6;
            vec3 subsurface = baseColor * sss * vec3(1.0, 0.3, 0.2);
            col = ambient + diffuse + specular + rim + subsurface;
            float iridescence = fres * 0.4;
            vec3 iriColor = vec3(
              sin(dot(nor, vec3(1.0, 0.0, 0.0)) * 6.0 + uTime) * 0.5 + 0.5,
              sin(dot(nor, vec3(0.0, 1.0, 0.0)) * 6.0 + uTime * 1.3) * 0.5 + 0.5,
              sin(dot(nor, vec3(0.0, 0.0, 1.0)) * 6.0 + uTime * 0.7) * 0.5 + 0.5
            );
            col += iriColor * iridescence;
            vec3 ref = reflect(-viewDir, nor);
            float envRefl = smoothstep(-0.2, 1.0, ref.y) * 0.15;
            col += vec3(0.3, 0.4, 0.8) * envRefl * fres;
          }
          col = col / (col + vec3(1.0));
          col = pow(col, vec3(1.0 / 2.2));
          float vig = 1.0 - 0.3 * dot(uv * 0.5, uv * 0.5);
          col *= vig;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthWrite: false,
      depthTest: false
    });

    const quad = new THREE.Mesh(quadGeometry, quadMaterial);
    quad.frustumCulled = false;

    const quadScene = new THREE.Scene();
    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    quadScene.add(quad);

    // ============ DOT MATRIX SHADER ============
    const DotMatrixShader = {
      uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        uDotSize: { value: settings.dither.dotSize },
        uDotGap: { value: settings.dither.dotGap },
        uBrightness: { value: settings.dither.brightness },
        uContrast: { value: settings.dither.contrast },
        uThreshold: { value: settings.dither.threshold },
        uDotColor: { value: new THREE.Vector3(...settings.dither.dotColor) },
        uBgColor: { value: new THREE.Vector3(...settings.dither.bgColor) },
        uCrossEnabled: { value: settings.crosshatch.enabled ? 1.0 : 0.0 },
        uCrossIntensity: { value: settings.crosshatch.intensity },
        uCrossAngle: { value: settings.crosshatch.angle },
        uBloomEnabled: { value: settings.bloom.enabled ? 1.0 : 0.0 },
        uBloomIntensity: { value: settings.bloom.intensity },
        uBloomSize: { value: settings.bloom.size },
        uCrtEnabled: { value: settings.crt.enabled ? 1.0 : 0.0 },
        uCrtCurvature: { value: settings.crt.curvature },
        uCrtScanlines: { value: settings.crt.scanlines },
        uCrtVignette: { value: settings.crt.vignette },
        uCrtChroma: { value: settings.crt.chroma },
        uDitherEnabled: { value: settings.dither.enabled ? 1.0 : 0.0 },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uDotSize;
        uniform float uDotGap;
        uniform float uBrightness;
        uniform float uContrast;
        uniform float uThreshold;
        uniform vec3 uDotColor;
        uniform vec3 uBgColor;
        uniform float uCrossEnabled;
        uniform float uCrossIntensity;
        uniform float uCrossAngle;
        uniform float uBloomEnabled;
        uniform float uBloomIntensity;
        uniform float uBloomSize;
        uniform float uCrtEnabled;
        uniform float uCrtCurvature;
        uniform float uCrtScanlines;
        uniform float uCrtVignette;
        uniform float uCrtChroma;
        uniform float uDitherEnabled;
        uniform float uTime;
        varying vec2 vUv;

        vec2 crtDistort(vec2 uv, float k) {
          vec2 cc = uv - 0.5;
          float r2 = dot(cc, cc);
          float f = 1.0 + r2 * k * 0.01;
          return cc * f + 0.5;
        }

        void main() {
          vec2 uv = vUv;
          if (uCrtEnabled > 0.5) {
            uv = crtDistort(uv, uCrtCurvature);
            if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
              gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
              return;
            }
          }
          vec3 col;
          if (uCrtEnabled > 0.5 && uCrtChroma > 0.01) {
            vec2 dir = (uv - 0.5) * uCrtChroma * 0.002;
            col.r = texture2D(tDiffuse, uv + dir).r;
            col.g = texture2D(tDiffuse, uv).g;
            col.b = texture2D(tDiffuse, uv - dir).b;
          } else {
            col = texture2D(tDiffuse, uv).rgb;
          }
          if (uDitherEnabled < 0.5) {
            gl_FragColor = vec4(col, 1.0);
            return;
          }
          
          vec2 pixelCoord = uv * uResolution;
          float spacing = uDotSize + uDotGap;
          vec2 cell = floor(pixelCoord / spacing);
          vec2 cellCenter = (cell + 0.5) * spacing;
          vec2 sampleUV = cellCenter / uResolution;
          
          vec3 cellCol = texture2D(tDiffuse, sampleUV).rgb;
          
          float lum = dot(cellCol, vec3(0.299, 0.587, 0.114));
          lum *= uBrightness;
          lum = (lum - 0.5) * (1.0 / uContrast) + 0.5;
          lum = clamp(lum, 0.0, 1.0);
          
          vec3 bgColor = uBgColor;
          if (lum > 1.0 - uThreshold) {
            vec3 result = bgColor;
            if (uCrtEnabled > 0.5 && uCrtScanlines > 0.001) {
              float scanline = sin(uv.y * uResolution.y * 0.8) * 0.5 + 0.5;
              result *= 1.0 - uCrtScanlines * (1.0 - scanline) * 0.3;
            }
            gl_FragColor = vec4(result, 1.0);
            return;
          }
          
          float objDensity = 1.0 - lum; 
          float maxRadius = uDotSize * 0.5;
          float minRadius = 0.4;
          float lumCurve = pow(objDensity, uContrast);
          float dotRadius = mix(minRadius, maxRadius, lumCurve);
          
          vec2 d = pixelCoord - cellCenter;
          float circleDist = length(d);
          float circleEdge = 1.0 - smoothstep(dotRadius - 0.5, dotRadius + 0.5, circleDist);
          
          vec3 dotColor = mix(uDotColor, vec3(60.0/255.0, 42.0/255.0, 33.0/255.0), lumCurve);
          
          vec3 result = bgColor;
          result = mix(result, dotColor, circleEdge);
          
          if (uCrtEnabled > 0.5 && uCrtScanlines > 0.001) {
            float scanline = sin(uv.y * uResolution.y * 0.8) * 0.5 + 0.5;
            result *= 1.0 - uCrtScanlines * (1.0 - scanline);
          }
          
          gl_FragColor = vec4(result, 1.0);
        }
      `
    };

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(quadScene, quadCamera));
    
    const dotMatrixPass = new ShaderPass(DotMatrixShader);
    composer.addPass(dotMatrixPass);
    composer.addPass(new OutputPass());

    // ============ ANIMATION LOOP ============
    const raycaster = new THREE.Raycaster();
    const _forward = new THREE.Vector3();
    let rafId: number;
    let lastTime = performance.now();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const currentTime = performance.now();
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      const elapsed = currentTime / 1000;
      lastTime = currentTime;
      controls.update();

      const targetR = mouseInScene ? (mousePressed ? mouseSphereClickRadius : mouseSphereTargetRadius) : 0.0;
      const fadeSpeed = mouseInScene ? (mousePressed ? 10.0 : 6.0) : 3.0;
      const step = Math.min(1.0, fadeSpeed * dt);
      mouseSphereRadius += (targetR - mouseSphereRadius) * step;
      if (mouseSphereRadius < 0.005 && !mouseInScene) mouseSphereRadius = 0.0;

      raycaster.setFromCamera(mouse, camera);
      const rayDir = raycaster.ray.direction;
      const rayOrigin = raycaster.ray.origin;
      _forward.subVectors(controls.target, camera.position).normalize();
      const dist = camera.position.distanceTo(controls.target);
      const t = dist / (rayDir.dot(_forward) || 0.001);
      mouseWorldTarget.copy(rayOrigin).addScaledVector(rayDir, t);
      mouseWorld.lerp(mouseWorldTarget, mouseDamping);

      quadMaterial.uniforms.uMouseSpherePos.value.copy(mouseWorld);
      quadMaterial.uniforms.uMouseSphereRadius.value = mouseSphereRadius;
      quadMaterial.uniforms.uTime.value = elapsed;
      quadMaterial.uniforms.uCameraPos.value.copy(camera.position);
      quadMaterial.uniforms.uCameraTarget.value.copy(controls.target);
      dotMatrixPass.uniforms.uTime.value = elapsed;

      composer.render();
    };
    animate();

    // ============ RESIZE ============
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      const pr = Math.min(window.devicePixelRatio, quality.pixelRatio);
      renderer.setPixelRatio(pr);
      renderer.setSize(width, height);

      quadMaterial.uniforms.uResolution.value.set(width, height);
      quadMaterial.uniforms.uPixelRatio.value = pr;
      dotMatrixPass.uniforms.uResolution.value.set(width, height);

      composer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      cancelAnimationFrame(rafId);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      composer.dispose();
    };
  }, []);

  return (
    <div ref={mountRef} className="absolute inset-0 z-0 bg-paper overflow-hidden" />
  );
}
