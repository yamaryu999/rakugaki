import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import DrawingCanvas from './components/DrawingCanvas';
import ARScene from './components/ARScene';

function App() {
    const mode = useAppStore((state) => state.mode);
    const [isXRSupported, setIsXRSupported] = useState<boolean | null>(null);

    useEffect(() => {
        if ('xr' in navigator) {
            // @ts-ignore - navigator.xr types might need specific polyfill or ignore
            navigator.xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
                setIsXRSupported(supported);
            });
        } else {
            setIsXRSupported(false);
        }
    }, []);

    if (isXRSupported === false) {
        return (
            <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-100 p-4 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">WebXR Not Supported</h1>
                <p className="text-gray-700">
                    Your browser does not support WebXR or AR features.
                    Please try using Chrome on Android or a compatible XR browser.
                </p>
                <p className="mt-4 text-sm text-gray-500">
                    Note: For local development, ensure you are using HTTPS.
                </p>
            </div>
        );
    }

    return (
        <>
            {mode === 'drawing' && <DrawingCanvas />}
            {mode === 'ar' && <ARScene />}
        </>
    );
}

export default App;
