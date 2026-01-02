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

    const fileInputRef = useRef<HTMLInputElement>(null);

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
            // Center and fit
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;
            ctx.drawImage(img, x, y, w, h);
        };
        img.src = dataUrl;
        setShowGallery(false);
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) handleLoad(result);
        };
        reader.readAsDataURL(file);

        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    return (
        <div className="relative w-full h-screen bg-white overflow-hidden">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
            />

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

            {/* Top Glass Bar: Utilities */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center bg-white/70 backdrop-blur-md border border-white/50 shadow-lg rounded-2xl p-2 pt-safe z-10 mx-auto max-w-lg">
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowGallery(true)}
                        className="p-3 bg-gray-100/50 hover:bg-white text-gray-700 rounded-xl transition-all active:scale-95"
                        title="Gallery"
                    >
                        <span className="text-xl">📁</span>
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-gray-100/50 hover:bg-white text-gray-700 rounded-xl transition-all active:scale-95"
                        title="Upload"
                    >
                        <span className="text-xl">📷</span>
                    </button>
                </div>

                <h1 className="text-gray-400 font-bold tracking-widest text-xs uppercase hidden sm:block">3D Doodle AR</h1>

                <div className="flex gap-2">
                    <button
                        onClick={handleClear}
                        className="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all active:scale-95"
                        title="Clear"
                    >
                        <span className="text-xl">🗑️</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className="p-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-all active:scale-95"
                        title="Save"
                    >
                        <span className="text-xl">💾</span>
                    </button>
                </div>
            </div>

            {/* Bottom: Enter AR (Main CTA) */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center pb-safe pointer-events-none z-10">
                <button
                    onClick={handleEnterAR}
                    className="pointer-events-auto px-10 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-black text-xl shadow-2xl shadow-purple-500/30 active:scale-95 hover:scale-105 transition-all ring-4 ring-white/30 backdrop-blur-sm"
                >
                    ✨ ENTER AR WORLD
                </button>
            </div>

            <div className="absolute bottom-4 left-4 pointer-events-none pb-safe">
                <p className="text-gray-400 text-sm">Draw something!</p>
            </div>

            {/* Gallery Modal */}
            {showGallery && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl overflow-hidden pb-safe">
                        <div className="p-4 flex justify-between items-center border-b border-gray-100">
                            <h2 className="text-xl font-black text-gray-800 tracking-tight">📁 My Gallery</h2>
                            <button
                                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                onClick={() => setShowGallery(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1">
                            {savedDrawings.length === 0 ? (
                                <div className="text-center py-20 text-gray-400">
                                    <p className="text-4xl mb-2">🎨</p>
                                    <p>No drawings yet.</p>
                                    <p className="text-xs mt-2">Draw something and hit save!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {savedDrawings.map((img, idx) => (
                                        <div key={idx} className="group relative bg-white rounded-2xl overflow-hidden aspect-square border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div
                                                className="absolute inset-0 bg-gray-50 pattern-grid-lg"
                                                style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                                            />
                                            <img
                                                src={img}
                                                className="absolute inset-0 w-full h-full object-contain p-2 cursor-pointer transition-transform group-hover:scale-105"
                                                onClick={() => handleLoad(img)}
                                            />
                                            <button
                                                className="absolute top-2 right-2 bg-white/80 hover:bg-red-50 text-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                                onClick={(e) => { e.stopPropagation(); deleteDrawing(idx); }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DrawingCanvas;
