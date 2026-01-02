import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store';

const DrawingCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const setTextureData = useAppStore((state) => state.setTextureData);
    const setMode = useAppStore((state) => state.setMode);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size to full screen
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
        ctx.strokeStyle = '#000000'; // Black ink
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
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
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

        // Convert to Data URL (creates a transparent PNG with black lines)
        const dataUrl = canvas.toDataURL('image/png');
        setTextureData(dataUrl);
        setMode('ar');
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

            {/* UI Overlay */}
            <div className="absolute bottom-12 left-0 right-0 flex flex-wrap justify-center gap-4 pointer-events-none px-4 pb-safe">
                <button
                    onClick={handleClear}
                    className="pointer-events-auto px-6 py-3 bg-red-100 text-red-600 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
                >
                    Clear
                </button>
                <button
                    onClick={handleEnterAR}
                    className="pointer-events-auto px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg active:scale-95 transition-transform"
                >
                    Enter AR
                </button>
            </div>

            <div className="absolute top-4 left-4 pointer-events-none">
                <p className="text-gray-400 text-sm">Draw something!</p>
            </div>
        </div>
    );
};

export default DrawingCanvas;
