import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll, Float, Stars, MeshDistortMaterial } from "@react-three/drei";
import { motion } from "framer-motion";
import { ArrowRight, Database, Repeat, Zap, Globe2, ChevronDown, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// --- 3D Components ---

const SceneNodes = () => {
  const scroll = useScroll();
  const group = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  
  // Create some orbiting particles
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ] as [number, number, number],
      speed: Math.random() * 0.02,
      factor: Math.random() * 0.5 + 0.5
    }));
  }, []);

  useFrame((state) => {
    const r1 = scroll.range(0, 1 / 4); // Hero to Step 1
    const r2 = scroll.range(1 / 4, 1 / 4); // Step 1 to Step 2
    const r3 = scroll.range(2 / 4, 1 / 4); // Step 2 to Step 3
    const r4 = scroll.range(3 / 4, 1 / 4); // Step 3 to Step 4

    const t = state.clock.getElapsedTime();

    if (group.current) {
      // Base rotation
      group.current.rotation.y = t * 0.1;
      
      // Move camera/group based on scroll
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, scroll.offset * 10, 0.1);
      
      // Scale up at the end (Scale phase)
      const targetScale = 1 + r4 * 2;
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, targetScale, 0.1));
    }

    if (coreRef.current) {
      coreRef.current.rotation.x = t * 0.2;
      coreRef.current.rotation.y = t * 0.3;
      // Core pulses faster in Step 3 (Automate)
      const pulseSpeed = 1 + r3 * 3;
      coreRef.current.scale.setScalar(1 + Math.sin(t * pulseSpeed) * 0.1);
      
      const mat = coreRef.current.material as any;
      if (mat && mat.distort !== undefined) {
        mat.distort = THREE.MathUtils.lerp(0.2, 0.8, r3); // Distort heavily during automate
      }
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.5;
      ring1Ref.current.rotation.y = t * 0.2;
      // Ring 1 appears in Step 2 (Connect)
      const scale = THREE.MathUtils.lerp(0.01, 2.5, r2 + r3 + r4);
      ring1Ref.current.scale.setScalar(scale);
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.3;
      ring2Ref.current.rotation.y = -t * 0.4;
      // Ring 2 appears in Step 2 (Connect)
      const scale = THREE.MathUtils.lerp(0.01, 3.5, r2 + r3 + r4);
      ring2Ref.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={group}>
      {/* Central Core (Data Hub) */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1, 4]} />
          <MeshDistortMaterial
            color="#f5a800" // CastHub Primary
            emissive="#f5a800"
            emissiveIntensity={0.5}
            wireframe={true}
            speed={2}
          />
        </mesh>
      </Float>

      {/* Orbiting Ring 1 (Channels) */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1, 0.02, 16, 100]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.5} /> {/* Pink for IG */}
      </mesh>

      {/* Orbiting Ring 2 (Channels) */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1, 0.02, 16, 100]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.5} /> {/* Emerald for WA */}
      </mesh>

      {/* Background Particles representing Data/Contacts */}
      {particles.map((p, i) => (
        <Particle key={i} data={p} />
      ))}
    </group>
  );
};

const Particle = ({ data }: { data: any }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      ref.current.position.y += Math.sin(t * data.speed) * 0.01;
      ref.current.position.x += Math.cos(t * data.speed) * 0.01;
    }
  });
  return (
    <mesh ref={ref} position={data.position}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
    </mesh>
  );
};

const CameraRig = () => {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 2, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.pointer.y * 2, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

// --- HTML Content Overlays ---

const HTMLContent = () => {
  return (
    <Scroll html style={{ width: '100vw', height: '100vh' }}>
      
      {/* ── HERO ── */}
      <div className="w-screen h-screen flex flex-col items-center justify-center text-center px-6 relative pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-6 backdrop-blur-md shadow-[0_0_15px_rgba(245,168,0,0.2)]">
            <Zap className="w-4 h-4" /> The CastHub Engine
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-tight drop-shadow-2xl">
            How The Magic <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-primary">Happens</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-medium max-w-2xl mx-auto mb-12 drop-shadow-md">
            Scroll down to discover how we transform messy spreadsheets into a high-powered, automated casting machine.
          </p>
        </motion.div>
        
        <div className="absolute bottom-12 flex flex-col items-center gap-2 animate-bounce opacity-70 pointer-events-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Scroll Down</span>
          <ChevronDown className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* ── STEP 1: IMPORT ── */}
      <div className="w-screen h-screen flex items-center justify-start px-6 sm:px-12 md:px-24 relative pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ margin: "-20%" }}
          transition={{ duration: 0.8 }}
          className="max-w-lg glass-card border-white/10 bg-black/40 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6">
            <Database className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">Step 01</h2>
          <h3 className="text-3xl md:text-4xl font-black text-white mb-4">Ingest Your Data</h3>
          <p className="text-white/70 font-medium leading-relaxed mb-6">
            Upload your massive casting spreadsheets in one click. Our AI-driven ingester instantly maps columns, standardizes formats, and constructs clean talent profiles for thousands of actors in seconds.
          </p>
          <ul className="space-y-3">
            {['Auto-column mapping', 'Duplicate detection', 'Instant database creation'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-white/90">
                <CheckCircle2 className="w-4 h-4 text-blue-400" /> {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* ── STEP 2: CONNECT ── */}
      <div className="w-screen h-screen flex items-center justify-end px-6 sm:px-12 md:px-24 relative pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ margin: "-20%" }}
          transition={{ duration: 0.8 }}
          className="max-w-lg glass-card border-white/10 bg-black/40 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
            <Globe2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">Step 02</h2>
          <h3 className="text-3xl md:text-4xl font-black text-white mb-4">Connect Channels</h3>
          <p className="text-white/70 font-medium leading-relaxed mb-6">
            Hook up your WhatsApp, Instagram, and Gmail directly to the platform. No complicated APIs—just scan a QR code or install our extension, and you're ready to communicate at scale.
          </p>
          <ul className="space-y-3">
            {['WhatsApp Web integration', 'Instagram DM automation', 'Gmail mass sending'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-white/90">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* ── STEP 3: AUTOMATE ── */}
      <div className="w-screen h-screen flex items-center justify-start px-6 sm:px-12 md:px-24 relative pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ margin: "-20%" }}
          transition={{ duration: 0.8 }}
          className="max-w-lg glass-card border-white/10 bg-black/40 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mb-6">
            <Repeat className="w-7 h-7 text-pink-400" />
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-400 mb-2">Step 03</h2>
          <h3 className="text-3xl md:text-4xl font-black text-white mb-4">Fire Sequences</h3>
          <p className="text-white/70 font-medium leading-relaxed mb-6">
            Create highly personalized message templates with dynamic variables. Select your audience, hit send, and watch as CastHub dispatches hundreds of tailored messages across all connected channels simultaneously.
          </p>
          <ul className="space-y-3">
            {['Dynamic {Variables}', 'Cross-channel sequences', 'Smart rate-limiting'].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-white/90">
                <CheckCircle2 className="w-4 h-4 text-pink-400" /> {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* ── CTA / FOOTER ── */}
      <div className="w-screen h-screen flex flex-col items-center justify-center text-center px-6 relative pointer-events-auto pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ margin: "-20%" }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl glass-card border-white/10 bg-black/60 backdrop-blur-3xl p-12 md:p-20 rounded-[3rem] shadow-[0_0_100px_rgba(245,168,0,0.15)]"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-6">Ready to scale your casting?</h2>
          <p className="text-lg text-white/70 font-medium mb-10 max-w-xl mx-auto leading-relaxed">
            Stop wasting hours copying and pasting messages. Join top casting directors who automate their workflow with CastHub.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/signup" className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-primary/20">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/login" className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center transition-all border border-white/10">
              Sign In
            </a>
          </div>
        </motion.div>
        
        {/* Simple inline footer for this immersive page */}
        <div className="absolute bottom-6 flex gap-6 text-[11px] font-bold text-white/40 uppercase tracking-widest">
          <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
          <a href="/contact" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>

    </Scroll>
  );
};

export default function HowItWorks() {
  return (
    <div className="w-full h-screen bg-[#030303] overflow-hidden fixed inset-0 z-50">
      
      {/* ── Floating Header ── */}
      <header className="fixed top-0 left-0 w-full p-6 lg:px-12 z-50 flex items-center justify-between pointer-events-auto">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/casthub-logo.png"
            alt="CastHub"
            className="w-10 h-10 object-contain shrink-0 drop-shadow-[0_0_10px_rgba(245,168,0,0.4)] group-hover:scale-110 transition-transform"
          />
          <span className="text-xl font-black tracking-tight text-white drop-shadow-md">CAST<span className="text-primary">HUB</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:flex text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="h-10 px-6 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary font-black text-xs uppercase tracking-widest flex items-center justify-center transition-colors border border-primary/20">
            Get Started
          </Link>
        </div>
      </header>

      {/* ── 3D Canvas ── */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        className="w-full h-full touch-none"
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#030303']} />
        
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ec4899" />
        <pointLight position={[10, -10, 5]} intensity={0.5} color="#10b981" />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <CameraRig />

        <ScrollControls pages={5} damping={0.2}>
          <SceneNodes />
          <HTMLContent />
        </ScrollControls>
      </Canvas>
    </div>
  );
}
