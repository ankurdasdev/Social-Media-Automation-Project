import { Canvas } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";

interface Animated3DBackgroundProps {
  className?: string;
}

export default function Animated3DBackground({ className = "absolute inset-0 -z-0 pointer-events-none opacity-40 dark:opacity-60 mix-blend-screen" }: Animated3DBackgroundProps) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.5} />
        <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
          <Stars radius={50} depth={20} count={300} factor={3} saturation={0} fade speed={0.5} />
        </Float>
      </Canvas>
    </div>
  );
}
