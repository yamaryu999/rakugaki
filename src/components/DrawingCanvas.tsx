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
        ctx.lineWidth = 4; // Slightly thinner for "pen" feel
        ctx.strokeStyle = '#2D2D2D'; // Pencil Black
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
        <div className="relative w-full h-full bg-[#FFFBF0] overflow-hidden font-hand">
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

            {/* === PENCIL CASE (Note: Using organic shapes) === */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none pb-safe">
                <div
                    className="flex items-center gap-3 px-4 py-3 bg-white pointer-events-auto border-sketch transform -rotate-1 shadow-lg"
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                >

                    {/* Left: Utilities */}
                    <button
                        onClick={() => setShowGallery(true)}
                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-700 animate-wobble hover:text-orange-500 transition-colors"
                        title="My Sketchbook"
                    >
                        📒
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-700 animate-wobble hover:text-blue-500 transition-colors"
                        title="Import"
                    >
                        📥
                    </button>

                    <div className="w-0.5 h-8 bg-gray-200 mx-1 transform rotate-6"></div>

                    {/* Center: PRIMARY AR ACTION - "STICKER" */}
                    <div className="relative -top-2">
                        <button
                            onClick={handleEnterAR}
                            className="bg-[#FF6B6B] text-white font-bold text-xl px-4 py-3 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] transform hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all flex flex-col items-center border-2 border-dashed border-white/50"
                            style={{
                                clipPath: 'polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 10%)',
                                borderRadius: '4px'
                            }}
                        >
                            <span className="text-2xl drop-shadow-sm">🚀</span>
                            <span className="text-xs font-bold uppercase tracking-wider mt-1">Go AR!</span>
                        </button>
                    </div>

                    <div className="w-0.5 h-8 bg-gray-200 mx-1 transform -rotate-3"></div>

                    {/* Right: Canvas Actions */}
                    <button
                        onClick={handleClear}
                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-700 animate-wobble hover:text-red-500 transition-colors"
                        title="Erase"
                    >
                        🧹
                    </button>

                    <button
                        onClick={handleSave}
                        className="w-10 h-10 flex items-center justify-center text-xl text-gray-700 animate-wobble hover:text-green-500 transition-colors"
                        title="Keep It"
                    >
                        📌
                    </button>
                </div>
            </div>

            {/* Top Text (Handwritten Title) */}
            <div className="absolute top-6 left-6 pointer-events-none pt-safe transform -rotate-2">
                <h1 className="font-hand font-bold text-3xl text-[#2D2D2D] tracking-wide relative inline-block">
                    Rakugaki
                    <span className="absolute -bottom-2 left-0 w-full h-1 bg-[#FFD93D] -z-10 rounded-sm transform skew-x-12 opacity-50"></span>
                </h1>
            </div>


            {/* === SKETCHBOOK OVERLAY === */}
            {showGallery && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 animate-fade-in bg-[#2D2D2D]/80 backdrop-blur-sm">
                    {/* Sketchbook Page */}
                    <div className="bg-white w-full max-w-lg h-[75vh] flex flex-col relative shadow-2xl paper-sheet transform rotate-1 overflow-visible">

                        {/* Spiral Binding Visuals */}
                        <div className="absolute -left-3 top-0 bottom-0 flex flex-col justify-evenly">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="w-8 h-4 bg-gray-300 rounded-full border border-gray-400 shadow-sm relative z-0"></div>
                            ))}
                        </div>

                        {/* App Header */}
                        <div className="p-6 pb-2 flex justify-between items-center border-b-2 border-dashed border-gray-200">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800">My Sketches</h2>
                                <p className="text-gray-500 text-sm">Tap to load, or tear out to delete.</p>
                            </div>
                            <button
                                onClick={() => setShowGallery(false)}
                                className="w-10 h-10 rounded-full border-2 border-gray-800 text-gray-800 flex items-center justify-center text-xl hover:bg-gray-100 transition-colors font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                            {savedDrawings.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
                                        <span className="text-6xl grayscale opacity-50">✏️</span>
                                    </div>
                                    <p className="font-bold text-xl mt-4 transform rotate-1">Blank Page...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-6">
                                    {savedDrawings.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="group relative bg-white p-2 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all transform hover:rotate-2 cursor-pointer"
                                            onClick={() => handleLoad(img)}
                                            style={{
                                                transform: `rotate(${idx % 2 === 0 ? '-2deg' : '1deg'})`
                                            }}
                                        >
                                            {/* Tape Visual */}
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-[#FFFFE0] opacity-80 shadow-sm rotate-1 z-10"></div>

                                            <div className="aspect-square border border-gray-100 overflow-hidden relative">
                                                <img src={img} className="w-full h-full object-contain" />
                                            </div>

                                            {/* Delete (Red X) */}
                                            <button
                                                className="absolute -bottom-2 -right-2 w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110 border-2 border-white"
                                                onClick={(e) => { e.stopPropagation(); deleteDrawing(idx); }}
                                            >
                                                ✕
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
