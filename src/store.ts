import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Vector3, Euler } from 'three';
import { v4 as uuidv4 } from 'uuid';

export type AppMode = 'drawing' | 'ar';

export interface Doodle {
    id: string;
    position: Vector3;
    rotation: Euler;
}

interface AppState {
    mode: AppMode;
    textureData: string | null;
    doodles: Doodle[];
    savedDrawings: string[];
    setMode: (mode: AppMode) => void;
    setTextureData: (data: string) => void;
    addDoodle: (position: Vector3, rotation: Euler) => void;
    resetDoodles: () => void;
    saveDrawing: (data: string) => void;
    deleteDrawing: (index: number) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            mode: 'drawing',
            textureData: null,
            doodles: [],
            savedDrawings: [],
            setMode: (mode) => set({ mode }),
            setTextureData: (data) => set({ textureData: data }),
            addDoodle: (position, rotation) =>
                set((state) => ({
                    doodles: [
                        ...state.doodles,
                        { id: uuidv4(), position, rotation },
                    ],
                })),
            resetDoodles: () => set({ doodles: [] }),
            saveDrawing: (data) =>
                set((state) => {
                    const newSaved = [data, ...state.savedDrawings];
                    return { savedDrawings: newSaved.slice(0, 5) }; // Keep top 5
                }),
            deleteDrawing: (index) =>
                set((state) => ({
                    savedDrawings: state.savedDrawings.filter((_, i) => i !== index)
                })),
        }),
        {
            name: 'rakugaki-storage',
            partialize: (state) => ({ savedDrawings: state.savedDrawings }), // Only persist drawings
        }
    )
);
