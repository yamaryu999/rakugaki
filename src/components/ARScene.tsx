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
            {/* Visual Reticle - Chalk Circle */}
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
        <div className="w-full h-full relative font-hand">
            {/* AR Button Container - Top Right */}
            <div className="absolute top-4 right-4 z-50 pt-safe">
                <ARButton
                    style={{
                        position: 'static',
                        padding: '12px 20px',
                        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                        background: '#FF6B6B',
                        color: 'white',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        boxShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                        border: '2px solid white',
                        fontSize: '14px',
                        transform: 'rotate(-2deg)'
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

            {/* Back Button - Top Left (Organic Sticker) */}
            <div className="absolute top-4 left-4 z-10 pt-safe pointer-events-none">
                <button
                    onClick={() => setMode('drawing')}
                    className="pointer-events-auto w-12 h-12 bg-white rounded-full text-[#2D2D2D] font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center border-2 border-[#2D2D2D] transform rotate-3 hover:rotate-0"
                    style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
                >
                    <span className="text-xl">←</span>
                </button>
            </div>

            {/* Instructions - Sticky Note */}
            <div className="absolute bottom-12 w-full text-center pointer-events-none z-10 px-4">
                <div className="inline-block px-6 py-3 bg-[#FFD93D] text-[#2D2D2D] border-2 border-[#E5C32E] shadow-lg transform rotate-1"
                    style={{
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 90%, 95% 100%, 0% 100%)' // Dog ear
                    }}
                >
                    <p className="font-bold text-lg tracking-wide">👇 Tap to stick it!</p>
                </div>
            </div>
        </div>
    );
};

export default ARScene;
