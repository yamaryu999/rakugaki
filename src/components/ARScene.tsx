import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, useHitTest, useXR, ARButton } from '@react-three/xr';
import { Billboard, Plane, useTexture } from '@react-three/drei';
import { Vector3, Quaternion, Euler } from 'three';
import { useAppStore } from '../store';

// Component to handle object placement logic
const ARController = () => {
    const { isPresenting, controllers } = useXR();
    const addDoodle = useAppStore((state) => state.addDoodle);
    const reticleRef = useRef<any>(null);

    const hitData = useRef<{ position: Vector3; rotation: Euler } | null>(null);

    useHitTest((hitMatrix) => {
        const position = new Vector3();
        const quaternion = new Quaternion();
        const scale = new Vector3();
        hitMatrix.decompose(position, quaternion, scale);

        hitData.current = {
            position,
            rotation: new Euler().setFromQuaternion(quaternion)
        };

        if (reticleRef.current) {
            reticleRef.current.position.copy(position);
            reticleRef.current.rotation.x = -Math.PI / 2;
        }
    });

    // Handle tap/select using XR session events if possible, or controller events
    const session = useXR((state) => state.session);
    useEffect(() => {
        if (!session) return;
        const onSelect = () => {
            if (hitData.current) {
                addDoodle(hitData.current.position.clone(), new Euler(0, 0, 0));
            }
        };
        session.addEventListener('select', onSelect);
        return () => session.removeEventListener('select', onSelect);
    }, [session, addDoodle]);

    // Also listen to controller events as fallback/supplement
    useEffect(() => {
        const handleSelect = () => {
            if (hitData.current) {
                addDoodle(hitData.current.position.clone(), new Euler(0, 0, 0));
            }
        };

        controllers.forEach(c => c.controller.addEventListener('select', handleSelect));

        return () => {
            controllers.forEach(c => c.controller.removeEventListener('select', handleSelect));
        }
    }, [controllers, addDoodle]);

    return (
        <>
            {/* Visual Reticle */}
            {isPresenting && (
                <mesh ref={reticleRef} rotation-x={-Math.PI / 2}>
                    <ringGeometry args={[0.15, 0.2, 32]} />
                    <meshBasicMaterial color="white" opacity={0.8} transparent />
                </mesh>
            )}
        </>
    );
};

// Wrapper to load texture safely
const DoodleMesh = ({ position, textureData }: { position: Vector3, textureData: string }) => {
    const texture = useTexture(textureData);

    return (
        <Billboard position={position}>
            <Plane args={[0.5, 0.5]}>
                <meshBasicMaterial map={texture} transparent side={2} />
            </Plane>
        </Billboard>
    );
};

const ARScene: React.FC = () => {
    const setMode = useAppStore((state) => state.setMode);
    const textureData = useAppStore((state) => state.textureData);
    const doodles = useAppStore((state) => state.doodles);

    return (
        <div className="w-full h-full relative">
            {/* AR Button Container - Top Right */}
            <div className="absolute top-4 right-4 z-50 pt-safe font-sans">
                <ARButton
                    style={{
                        position: 'static',
                        padding: '12px 24px',
                        borderRadius: '9999px',
                        background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)', // indigo-500 -> purple-500 -> pink-500
                        color: 'white',
                        fontWeight: '800', // Extra bold
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.4)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        fontSize: '14px',
                        width: 'auto',
                        height: 'auto',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    Start Camera
                </ARButton>
            </div>

            <Canvas gl={{ alpha: true }}>
                <XR>
                    <ambientLight intensity={1} />
                    <ARController />
                    {textureData && doodles.map((doodle) => (
                        <DoodleMesh
                            key={doodle.id}
                            position={doodle.position}
                            textureData={textureData}
                        />
                    ))}
                </XR>
            </Canvas>

            <div className="absolute top-4 left-4 z-10 pt-safe pointer-events-none">
                <button
                    onClick={() => setMode('drawing')}
                    className="pointer-events-auto px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold shadow-lg active:scale-95 transition-all hover:bg-white/20 flex items-center gap-2"
                >
                    <span>←</span> <span className="text-sm">Back</span>
                </button>
            </div>

            <div className="absolute bottom-12 w-full text-center pointer-events-none z-10 px-4">
                <div className="inline-block px-6 py-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl">
                    <p className="text-white font-medium text-sm">👇 Tap any surface to place your art!</p>
                </div>
            </div>
        </div>
    );
};

export default ARScene;
