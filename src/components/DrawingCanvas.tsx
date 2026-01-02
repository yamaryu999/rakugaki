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
        ctx.strokeStyle = '#334155'; // Slate-700
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
        // Toast notification could go here
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
        <div className="relative w-full h-full bg-slate-50 overflow-hidden font-outfit">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
            />

            <canvas
                ref={canvasRef}
                className="block touch-none cursor-crosshair w-full h-full absolute inset-0 z-0 bg-transparent"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />

            {/* === UNIFIED FLOATING CAPSULE === */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 pointer-events-none pb-safe animate-float">
                <div className="capsule-bar flex items-center gap-1 shadow-soft pointer-events-auto bg-white/95 backdrop-blur-xl border border-white/40 ring-1 ring-black/5">

                    {/* Left: Utilities */}
                    <button
                        onClick={() => setShowGallery(true)}
                        className="w-12 h-12 rounded-full hover:bg-slate-100 flex items-center justify-center text-xl text-slate-600 btn-bouncy relative"
                    >
                        📂
                        {savedDrawings.length > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full border border-white"></span>
                        )}
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-12 h-12 rounded-full hover:bg-slate-100 flex items-center justify-center text-xl text-slate-600 btn-bouncy"
                    >
                        📷
                    </button>

                    {/* Center: PRIMARY AR ACTION */}
                    <div className="px-2">
                        <button
                            onClick={handleEnterAR}
                            className="h-14 px-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-extrabold text-lg shadow-lg shadow-purple-500/30 btn-bouncy flex items-center gap-2 hover:brightness-110"
                        >
                            <span>🚀</span>
                            <span className="tracking-widest text-sm">GO AR</span>
                        </button>
                    </div>

                    {/* Right: Canvas Actions */}
                    <button
                        onClick={handleClear}
                        className="w-12 h-12 rounded-full hover:bg-red-50 flex items-center justify-center text-xl text-slate-400 hover:text-red-500 btn-bouncy transition-colors"
                    >
                        🗑️
                    </button>

                    <button
                        onClick={handleSave}
                        className="w-12 h-12 rounded-full hover:bg-emerald-50 flex items-center justify-center text-xl text-slate-400 hover:text-emerald-500 btn-bouncy transition-colors"
                    >
                        💾
                    </button>
                </div>
            </div>

            {/* Top Text (Minimal) */}
            <div className="absolute top-6 left-0 right-0 text-center pointer-events-none pt-safe opacity-30">
                <h1 className="font-outfit font-black text-2xl tracking-tight text-slate-900 uppercase">Rakugaki</h1>
            </div>


            {/* === MODERN GALLERY OVERLAY === */}
            {showGallery && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 animate-fade-in bg-slate-900/20 backdrop-blur-sm">
                    {/* Card Container */}
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md h-[70vh] flex flex-col overflow-hidden relative border border-white/50 ring-1 ring-black/5">

                        {/* Header */}
                        <div className="p-6 flex justify-between items-center bg-white/50 backdrop-blur-md z-10 sticky top-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Your Gallery</h2>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{savedDrawings.length} Creations</p>
                            </div>
                            <button
                                onClick={() => setShowGallery(false)}
                                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 btn-bouncy font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Bento Grid */}
                        <div className="flex-1 overflow-y-auto p-6 pt-0">
                            {savedDrawings.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                    <span className="text-6xl mb-4 grayscale opacity-50">🎨</span>
                                    <p className="font-semibold">Gallery is Empty</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 auto-rows-fr">
                                    {savedDrawings.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="group relative rounded-3xl overflow-hidden aspect-square bg-slate-50 shadow-sm border border-slate-100 btn-bouncy cursor-pointer"
                                            onClick={() => handleLoad(img)}
                                        >
                                            {/* Grid Pattern Background */}
                                            <div className="absolute inset-0 bg-grid-pattern opacity-50" />

                                            <img src={img} className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />

                                            {/* Delete Overlay */}
                                            <button
                                                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
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
