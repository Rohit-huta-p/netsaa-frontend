import { useRef, useState, useEffect, useCallback } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Dimensions } from 'react-native';

export function useCarousel(
    itemsLength: number,
    initialIdx = 0
) {
    const flatListRef = useRef<any>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIdx);

    // -------------------------------------------------------------------------
    // 1️⃣  Scroll to a specific index (used by arrows and on mount)
    // -------------------------------------------------------------------------
    const scrollToIndex = useCallback(
        (index: number, animated = true) => {
            if (index < 0 || index >= itemsLength) return;
            flatListRef.current?.scrollToIndex({ index, animated });
        },
        [itemsLength]
    );

    // -------------------------------------------------------------------------
    // 2️⃣  Keep the index in sync when the user swipes
    // -------------------------------------------------------------------------
    const onMomentumScrollEnd = useCallback(
        (e: NativeSyntheticEvent<any>) => {
            const { width } = Dimensions.get('window');
            const offsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / width);
            if (index !== currentIndex) {
                setCurrentIndex(index);
            }
        },
        [currentIndex]
    );

    // -------------------------------------------------------------------------
    // 3️⃣  When the modal becomes visible we must jump to the initial item
    // -------------------------------------------------------------------------
    useEffect(() => {
        // Small timeout to give FlatList a chance to measure its children
        const timer = setTimeout(() => scrollToIndex(initialIdx, false), 100);
        return () => clearTimeout(timer);
    }, [initialIdx, scrollToIndex]);

    return {
        flatListRef,
        currentIndex,
        scrollToIndex,
        onMomentumScrollEnd,
    };
}
