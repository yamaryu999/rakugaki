import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store';

const DrawingCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showGallery, setShowGallery] = useState(false);

    const setTextureData = useAppStore((state) => state.setTextureData);
    const setMode = useAppStore((state) => state.setMode);

    // Gallery State
    const savedDrawings = useAppStore((state) => state.savedDrawings);
    const saveDrawing = useAppStore((state) => state.saveDrawing);
    const deleteDrawing = useAppStore((state) => state.deleteDrawing);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeValues = () => {
            // Need to save content before resizing if we want to preserve it?
            // For now, simple resize clears canvas, which is standard simple behavior.
            // But to be nice, we could save/restore.
            // Let's keep it simple as per prompt requirements.
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeValues);
        resizeValues();

        return () => window.removeEventListener('resize', resizeValues);
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);

        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#000000';
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) ctx.closePath();
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        if ('touches' in e) {
            const touch = e.touches[0];
            return { x: touch.clientX, y: touch.clientY };
        } else {
            return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
        }
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleEnterAR = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        setTextureData(dataUrl);
        setMode('ar');
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        saveDrawing(dataUrl);
        alert('Drawing saved to Gallery!');
    };

    const handleLoad = (dataUrl: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
        setShowGallery(false);
    };

    return (
        <div className="relative w-full h-screen bg-white overflow-hidden">
            <canvas
                ref={canvasRef}
                className="block touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />

            {/* Top Buttons: Gallery (Left) | Actions (Right) */}
            <div className="absolute top-4 left-4 pt-safe pointer-events-none z-10">
                <button
                    onClick={() => setShowGallery(true)}
                    className="pointer-events-auto px-4 py-2 bg-yellow-400 text-white rounded-full font-bold shadow-md active:scale-95 transition-transform"
                >
                    📁 Gallery
                </button>
            </div>

            <div className="absolute top-4 right-4 flex gap-2 pointer-events-none pt-safe z-10">
                <button
                    onClick={handleClear}
                    className="pointer-events-auto px-4 py-2 bg-red-100 text-red-600 rounded-full font-bold shadow-md active:scale-95 transition-transform"
                >
                    Clear
                </button>
                <button
                    onClick={handleSave}
                    className="pointer-events-auto px-4 py-2 bg-green-500 text-white rounded-full font-bold shadow-md active:scale-95 transition-transform"
                >
                    Save
                </button>
                <button
                    onClick={handleEnterAR}
                    className="pointer-events-auto px-4 py-2 bg-blue-600 text-white rounded-full font-bold shadow-md active:scale-95 transition-transform"
                >
                    Enter AR
                </button>
            </div>

            <div className="absolute bottom-4 left-4 pointer-events-none pb-safe">
                <p className="text-gray-400 text-sm">Draw something!</p>
            </div>

            {/* Gallery Modal */}
            {showGallery && (
                <div className="absolute inset-0 bg-black/80 z-50 flex flex-col p-4 pt-16 animate-fade-in">
                    <button
                        className="absolute top-4 right-4 text-white text-2xl font-bold p-2 pt-safe pointer-events-auto"
                        onClick={() => setShowGallery(false)}
                    >
                        ✕ Close
                    </button>
                    <h2 className="text-white text-xl font-bold mb-4 text-center">Your Saved Drawings</h2>

                    {savedDrawings.length === 0 ? (
                        <p className="text-gray-400 text-center mt-10">No drawings saved yet.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-safe">
                            {savedDrawings.map((img, idx) => (
                                <div key={idx} className="relative bg-white rounded-lg overflow-hidden aspect-square border-2 border-gray-200">
                                    <img
                                        src={img}
                                        className="w-full h-full object-contain cursor-pointer"
                                        onClick={() => handleLoad(img)}
                                    />
                                    <button
                                        className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                                        onClick={() => deleteDrawing(idx)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DrawingCanvas;
