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
        <div className="w-full h-full relative bg-black">
            {/* Native WebXR Button is required to start session cleanly */}
            <ARButton
                sessionInit={{
                    requiredFeatures: ['hit-test', 'dom-overlay'],
                    domOverlay: { root: document.getElementById('ar-overlay')! }
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-8 py-4 bg-blue-600 text-white rounded-full font-bold shadow-lg z-50 !important"
            >
                Start Camera
            </ARButton>

            <Canvas>
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

            {/* DOM Overlay Container */}
            <div id="ar-overlay" className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-4 left-0 right-0 flex justify-center pt-safe pointer-events-none">
                    <button
                        onClick={() => setMode('drawing')}
                        className="pointer-events-auto px-4 py-2 bg-white/80 rounded-full font-bold shadow-md active:scale-95 transition-transform"
                    >
                        ← Back to Drawing
                    </button>
                </div>

                <div className="absolute bottom-10 w-full text-center pointer-events-none">
                    <p className="text-white text-sm bg-black/30 inline-block px-2 rounded">Find a surface and tap to place!</p>
                </div>
            </div>
        </div>
    );
};

export default ARScene;
