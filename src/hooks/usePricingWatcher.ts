import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { ActiveTier, IEventTicketType } from '@/types/event';

interface PricingWatchResult {
    ticketTypeId: string;
    oldPrice: number;
    newPrice: number;
    oldTier: ActiveTier | null;
    newTier: ActiveTier | null;
    priceIncreased: boolean;
    priceDifference: number;
}

interface UsePricingWatcherOptions {
    eventId?: string;
    ticketTypes?: IEventTicketType[];
    checkInterval?: number;  // milliseconds
    onPriceChange?: (result: PricingWatchResult) => void;
    enabled?: boolean;
}

/**
 * Hook to watch for pricing tier changes and notify users of price updates.
 * Useful for showing warnings when a tier expires while user is browsing.
 */
export function usePricingWatcher({
    eventId,
    ticketTypes,
    checkInterval = 30000,  // Default: check every 30 seconds
    onPriceChange,
    enabled = true,
}: UsePricingWatcherOptions) {
    const [lastKnownPrices, setLastKnownPrices] = useState<Record<string, number>>({});
    const [lastKnownTiers, setLastKnownTiers] = useState<Record<string, ActiveTier | null>>({});
    const [hasPriceChanged, setHasPriceChanged] = useState(false);
    const [priceChanges, setPriceChanges] = useState<PricingWatchResult[]>([]);

    const hasShownAlert = useRef<Record<string, boolean>>({});

    const checkPriceChanges = useCallback(async () => {
        if (!enabled || !ticketTypes || ticketTypes.length === 0) return;

        const changes: PricingWatchResult[] = [];

        for (const ticket of ticketTypes) {
            if (!ticket._id || !ticket.activeTier) continue;

            const lastPrice = lastKnownPrices[ticket._id];
            const currentPrice = ticket.activeTier.price;
            const currentTier = ticket.activeTier;
            const lastTier = lastKnownTiers[ticket._id];

            // Initialize on first run
            if (lastPrice === undefined) {
                setLastKnownPrices(prev => ({ ...prev, [ticket._id]: currentPrice }));
                setLastKnownTiers(prev => ({ ...prev, [ticket._id]: currentTier }));
                continue;
            }

            // Detect price change
            if (lastPrice !== currentPrice) {
                const priceIncreased = currentPrice > lastPrice;
                const change: PricingWatchResult = {
                    ticketTypeId: ticket._id,
                    oldPrice: lastPrice,
                    newPrice: currentPrice,
                    oldTier: lastTier,
                    newTier: currentTier,
                    priceIncreased,
                    priceDifference: Math.abs(currentPrice - lastPrice),
                };

                changes.push(change);
                setHasPriceChanged(true);

                // Notify parent callback
                if (onPriceChange) {
                    onPriceChange(change);
                }

                // Show alert if not already shown for this ticket
                if (!hasShownAlert.current[ticket._id]) {
                    hasShownAlert.current[ticket._id] = true;

                    if (priceIncreased) {
                        Alert.alert(
                            'Price Update',
                            `The price for ${ticket.name} has increased from ₹${lastPrice} to ₹${currentPrice} due to tier expiry.`,
                            [{ text: 'OK' }]
                        );
                    } else {
                        Alert.alert(
                            'Price Drop!',
                            `Great news! The price for ${ticket.name} has dropped from ₹${lastPrice} to ₹${currentPrice}.`,
                            [{ text: 'Great!' }]
                        );
                    }
                }
            }

            // Update last known values
            setLastKnownPrices(prev => ({ ...prev, [ticket._id]: currentPrice }));
            setLastKnownTiers(prev => ({ ...prev, [ticket._id]: currentTier }));
        }

        if (changes.length > 0) {
            setPriceChanges(prev => [...prev, ...changes]);
        }
    }, [enabled, ticketTypes, lastKnownPrices, lastKnownTiers, onPriceChange]);

    // Poll for changes
    useEffect(() => {
        if (!enabled || !ticketTypes || ticketTypes.length === 0) return;

        // Initial check
        checkPriceChanges();

        // Set up polling interval
        const intervalId = setInterval(checkPriceChanges, checkInterval);

        return () => clearInterval(intervalId);
    }, [enabled, ticketTypes, checkInterval, checkPriceChanges]);

    // Reset function (e.g., when navigating away)
    const reset = useCallback(() => {
        setLastKnownPrices({});
        setLastKnownTiers({});
        setHasPriceChanged(false);
        setPriceChanges([]);
        hasShownAlert.current = {};
    }, []);

    return {
        hasPriceChanged,
        priceChanges,
        checkPriceChanges,
        reset,
    };
}

/**
 * Hook to fetch and watch active pricing for an event.
 * Combines API polling with the pricing watcher.
 */
export function useEventPricing(eventId?: string, checkInterval: number = 30000) {
    const [ticketTypes, setTicketTypes] = useState<IEventTicketType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [globalRegistrations, setGlobalRegistrations] = useState(0);

    const fetchPricing = useCallback(async () => {
        if (!eventId) return;

        setIsLoading(true);
        setError(null);

        try {
            // Note: Adjust API endpoint as needed
            const response = await fetch(`/api/grow/events/${eventId}/active-pricing`);
            const result = await response.json();

            if (result.meta?.status === 200) {
                setTicketTypes(result.data.ticketTypes || []);
                setGlobalRegistrations(result.data.globalRegistrations || 0);
            } else {
                setError(result.meta?.message || 'Failed to fetch pricing');
            }
        } catch (err: any) {
            setError(err.message || 'Network error');
        } finally {
            setIsLoading(false);
        }
    }, [eventId]);

    // Initial fetch
    useEffect(() => {
        if (eventId) {
            fetchPricing();
        }
    }, [eventId, fetchPricing]);

    // Watch for pricing changes
    const { hasPriceChanged, priceChanges, reset } = usePricingWatcher({
        eventId,
        ticketTypes,
        checkInterval,
        enabled: !!eventId,
    });

    return {
        ticketTypes,
        isLoading,
        error,
        hasPriceChanged,
        priceChanges,
        globalRegistrations,
        refreshPricing: fetchPricing,
        reset,
    };
}
