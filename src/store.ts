import { create } from 'zustand';
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
    setMode: (mode: AppMode) => void;
    setTextureData: (data: string) => void;
    addDoodle: (position: Vector3, rotation: Euler) => void;
    resetDoodles: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    mode: 'drawing',
    textureData: null,
    doodles: [],
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
}));
