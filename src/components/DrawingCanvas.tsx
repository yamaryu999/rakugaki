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
        <div className="relative w-full h-full bg-slate-50 overflow-hidden font-sans">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
            />

            <canvas
                ref={canvasRef}
                className="block touch-none cursor-crosshair w-full h-full absolute inset-0 z-0 bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />

            {/* === HEADER === */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-safe z-10 flex justify-between items-start pointer-events-none">
                {/* Logo / Title */}
                <div className="glass-panel px-4 py-2 rounded-full pointer-events-auto shadow-sm">
                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-sm tracking-widest uppercase">
                        RAKUGAKI
                    </span>
                </div>

                {/* Gallery Bundle */}
                <button
                    onClick={() => setShowGallery(true)}
                    className="glass-button px-4 py-2 rounded-full pointer-events-auto shadow-sm flex items-center gap-2 group"
                >
                    <span className="text-xl group-hover:scale-110 transition-transform">📁</span>
                    <span className="text-gray-600 font-bold text-sm">Gallery</span>
                    {savedDrawings.length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
                            {savedDrawings.length}
                        </span>
                    )}
                </button>
            </div>

            {/* === BOTTOM DOCK === */}
            <div className="absolute bottom-6 left-4 right-4 z-20 pb-safe pointer-events-none flex justify-center items-end">
                <div className="glass-panel px-6 py-4 rounded-3xl shadow-xl flex items-center gap-8 pointer-events-auto">
                    {/* Left Tools */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center gap-1 group w-12"
                        >
                            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-lg shadow-sm group-active:scale-95 transition-transform border border-purple-100">
                                📷
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">Add</span>
                        </button>
                        <button
                            onClick={handleClear}
                            className="flex flex-col items-center gap-1 group w-12"
                        >
                            <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-lg shadow-sm group-active:scale-95 transition-transform border border-red-100">
                                🗑️
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">Clear</span>
                        </button>
                    </div>

                    {/* HERO ACTION: AR FAB */}
                    <div className="relative -top-8">
                        <div className="absolute inset-0 rounded-full animate-pulse-ring"></div>
                        <button
                            onClick={handleEnterAR}
                            className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-2xl flex items-center justify-center flex-col transform active:scale-95 transition-all hover:-translate-y-1 relative z-10 border-4 border-white/50"
                        >
                            <span className="text-3xl filter drop-shadow-md">🚀</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">GO AR</span>
                        </button>
                    </div>

                    {/* Right Tools */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            className="flex flex-col items-center gap-1 group w-12"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-lg shadow-sm group-active:scale-95 transition-transform border border-green-100">
                                💾
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">Save</span>
                        </button>
                        {/* Placeholder for symmetry or future feature */}
                        <div className="w-12"></div>
                    </div>
                </div>
            </div>

            {/* === GALLERY SHEET (DRAWER) === */}
            {showGallery && (
                <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-none">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
                        onClick={() => setShowGallery(false)}
                    ></div>

                    {/* Sheet */}
                    <div className="bg-slate-50 rounded-t-[2.5rem] p-6 shadow-2xl h-[75vh] w-full pointer-events-auto animate-slide-up relative flex flex-col">
                        {/* Drag Handle (Visual only) */}
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-800">Your Artworks</h2>
                            <button
                                onClick={() => setShowGallery(false)}
                                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 pb-safe">
                            {savedDrawings.length === 0 ? (
                                <div className="text-center py-20 opacity-50 flex flex-col items-center">
                                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl mb-4">🎨</div>
                                    <p className="text-lg font-medium text-gray-800">Empty Gallery</p>
                                    <p className="text-sm text-gray-500">Create new masterpieces to save them here.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {savedDrawings.map((img, idx) => (
                                        <div key={idx} className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 relative group overflow-hidden">
                                            <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 relative cursor-pointer" onClick={() => handleLoad(img)}>
                                                <div
                                                    className="absolute inset-0"
                                                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '8px 8px' }}
                                                />
                                                <img src={img} className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-110" />
                                            </div>
                                            <div className="flex justify-between items-center mt-3 px-1">
                                                <span className="text-xs font-bold text-gray-400">#{savedDrawings.length - idx}</span>
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); deleteDrawing(idx); }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
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
