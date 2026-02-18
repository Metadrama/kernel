import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
    const subscribe = (onStoreChange: () => void) => {
        const media = window.matchMedia(query);
        media.addEventListener('change', onStoreChange);
        return () => media.removeEventListener('change', onStoreChange);
    };

    const getSnapshot = () => window.matchMedia(query).matches;
    const getServerSnapshot = () => false;

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
