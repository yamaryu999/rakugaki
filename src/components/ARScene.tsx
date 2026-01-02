import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { XR, Controllers, Hands, useHitTest, useXR } from '@react-three/xr';
import { Billboard, Plane, useTexture } from '@react-three/drei';
import { Vector3, Matrix4, Quaternion, Euler } from 'three';
import { useAppStore } from '../store';

const Reticle = () => {
    const ref = useRef<any>(null);
    const { isPresenting } = useXR();

    useHitTest((hitMatrix) => {
        if (ref.current) {
            hitMatrix.decompose(
                ref.current.position,
                ref.current.quaternion,
                ref.current.scale
            );
            ref.current.rotation.set(-Math.PI / 2, 0, 0); // Lay flat on floor
        }
    });

    if (!isPresenting) return null;

    return (
        <mesh ref={ref} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.1, 0.25, 32]} />
            <meshBasicMaterial color="white" />
        </mesh>
    );
};

// Component to handle object placement logic
const ARController = () => {
    const { isPresenting, player } = useXR();
    const addDoodle = useAppStore((state) => state.addDoodle);
    const reticleRef = useRef<any>(null);

    // We use a dedicated reticle for hit testing logic inside this controller
    // distinct from the visual Reticle above if we wanted, but let's combine logic?
    // Actually, we can just use useHitTest here to get the position when "Select" happens.
    // But useHitTest runs every frame.

    // Better approach: Keep track of latest hit in a Ref, and on 'select' event, use it.
    const hitData = useRef<{ position: Vector3; rotation: Euler } | null>(null);

    useHitTest((hitMatrix) => {
        const position = new Vector3();
        const quaternion = new Quaternion();
        const scale = new Vector3();
        hitMatrix.decompose(position, quaternion, scale);

        // We want the billboard to be at this position.
        // Rotation will be handled by Billboard component automatically facing camera.
        // But we might want to preserve the "floor height".

        hitData.current = {
            position,
            rotation: new Euler().setFromQuaternion(quaternion) // Not strictly used for Billboard but good to have
        };

        if (reticleRef.current) {
            reticleRef.current.position.copy(position);
            reticleRef.current.rotation.x = -Math.PI / 2;
        }
    });

    // Handle tap/select
    const { controllers } = useXR();
    useEffect(() => {
        const handleSelect = () => {
            if (hitData.current) {
                // Add doodle at the reticle position
                addDoodle(hitData.current.position.clone(), new Euler(0, 0, 0));
            }
        };

        // Subscribe to select events from all controllers (screen tap is a controller in mobile AR)
        controllers.forEach(c => c.controller.addEventListener('select', handleSelect));

        return () => {
            controllers.forEach(c => c.controller.removeEventListener('select', handleSelect));
        }
    }, [controllers, addDoodle]);

    // We need to re-bind listeners if controllers change? 
    // useXR provides an event mechanism.

    // Alternative using useThree and event listener on canvas? No, XR 'select' is specific.
    // @react-three/xr provides `useXR` which has `addEventListener` in newer versions, 
    // but for v5 we iterate controllers or use <Interactive>.
    // Since we are tapping on "nothing" (the floor), <Interactive> needs a mesh to hit.
    // But we haven't placed the floor mesh yet.

    // Standard pattern in v5 for "Tap to Place":
    // Use `useThree` to access gl.xr and add event listener to session?

    // Let's stick to the simplest: Checking for tap in useFrame? No.
    // Let's use the explicit `Select` component or `useXR` events if available.
    // v5 has `useXR().session`

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
import { useEffect } from 'react';

// Wrapper to load texture safely
const DoodleMesh = ({ position, textureData }: { position: Vector3, textureData: string }) => {
    const texture = useTexture(textureData);

    return (
        <Billboard position={position}>
            <Plane args={[0.5, 0.5]}> {/* Fixed size for now, user can scale via logic later if needed */}
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
        <div className="w-full h-screen relative">
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

            {/* Overlay UI */}
            <div className="absolute top-4 left-4 z-10">
                <button
                    onClick={() => setMode('drawing')}
                    className="px-4 py-2 bg-white/80 rounded-full font-bold shadow-md"
                >
                    ← Back to Drawing
                </button>
            </div>
            <div className="absolute bottom-10 w-full text-center pointer-events-none">
                <p className="text-white text-sm bg-black/30 inline-block px-2 rounded">Find a surface and tap to place!</p>
            </div>
        </div>
    );
};

export default ARScene;
