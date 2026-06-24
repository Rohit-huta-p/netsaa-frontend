import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Clock, Users, AlertTriangle, TrendingUp } from 'lucide-react-native';
import { ActiveTier, PricingTier } from '@/types/event';

interface PricingTierDisplayProps {
    activeTier: ActiveTier | null;
    nextTier?: ActiveTier;
    allTiers?: PricingTier[];
    onRegister?: () => void;
    showWarning?: boolean;
}

export const PricingTierDisplay: React.FC<PricingTierDisplayProps> = ({
    activeTier,
    nextTier,
    allTiers,
    onRegister,
    showWarning = false,
}) => {
    if (!activeTier) return null;

    const isExpiringSoon = activeTier.expiresAt
        ? new Date(activeTier.expiresAt).getTime() - Date.now() < 3600000 // 1 hour
        : false;

    const isLowCapacity = activeTier.remainingSlots !== undefined
        ? activeTier.remainingSlots < 10
        : false;

    const showUrgency = isExpiringSoon || isLowCapacity || showWarning;

    return (
        <View className="gap-4">
            {/* Active Tier Card */}
            <View className={`rounded-xl p-4 border ${showUrgency
                    ? 'bg-orange-500/10 border-orange-500/30'
                    : 'bg-zinc-900/50 border-white/10'
                }`}>
                <View className="flex-row justify-between items-start mb-3">
                    <View>
                        <View className="flex-row items-center gap-2 mb-1">
                            <Text className="text-white font-bold text-lg">{activeTier.name}</Text>
                            {showUrgency && (
                                <View className="px-2 py-0.5 bg-orange-500/20 rounded-full">
                                    <View className="flex-row items-center gap-1">
                                        <AlertTriangle size={10} color="#F97316" />
                                        <Text className="text-orange-500 text-[10px] font-bold">
                                            {isExpiringSoon ? 'EXPIRING SOON' : 'LOW STOCK'}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                        <Text className="text-zinc-400 text-sm">
                            {activeTier.isBasePrice ? 'Standard pricing' : 'Limited offer'}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-white font-black text-2xl">₹{activeTier.price}</Text>
                        {nextTier && nextTier.price > activeTier.price && (
                            <Text className="text-zinc-500 text-xs line-through">₹{nextTier.price}</Text>
                        )}
                    </View>
                </View>

                {/* Urgency Indicators */}
                {showUrgency && (
                    <View className="flex-row gap-3 mb-3">
                        {isExpiringSoon && activeTier.expiresAt && (
                            <View className="flex-row items-center gap-2 bg-orange-500/10 px-3 py-2 rounded-lg flex-1">
                                <Clock size={16} color="#F97316" />
                                <View>
                                    <Text className="text-orange-500 text-xs font-bold">Ends in</Text>
                                    <Text className="text-orange-400 text-sm font-medium">
                                        {formatTimeRemaining(activeTier.expiresAt)}
                                    </Text>
                                </View>
                            </View>
                        )}
                        {isLowCapacity && activeTier.remainingSlots !== undefined && (
                            <View className="flex-row items-center gap-2 bg-orange-500/10 px-3 py-2 rounded-lg flex-1">
                                <Users size={16} color="#F97316" />
                                <View>
                                    <Text className="text-orange-500 text-xs font-bold">Only</Text>
                                    <Text className="text-orange-400 text-sm font-medium">
                                        {activeTier.remainingSlots} left
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Next Tier Preview */}
                {nextTier && !nextTier.isBasePrice && (
                    <View className="flex-row items-center gap-2 pt-3 border-t border-white/10">
                        <TrendingUp size={14} color="#71717a" />
                        <Text className="text-zinc-500 text-xs flex-1">
                            Next: {nextTier.name} at ₹{nextTier.price}
                        </Text>
                        {activeTier.expiresAt && (
                            <Text className="text-zinc-600 text-[10px]">
                                {isExpiringSoon ? 'Very soon!' : `in ${formatTimeRemaining(activeTier.expiresAt)}`}
                            </Text>
                        )}
                    </View>
                )}
            </View>

            {/* All Tiers Timeline */}
            {allTiers && allTiers.length > 0 && (
                <View className="px-2">
                    <Text className="text-zinc-500 text-xs font-medium mb-2 uppercase tracking-wider">
                        Pricing Timeline
                    </Text>
                    <View className="gap-2">
                        {allTiers.map((tier, index) => {
                            const isActive = tier.name === activeTier.name;
                            const isPast = index < allTiers.findIndex(t => t.name === activeTier.name);

                            return (
                                <View
                                    key={index}
                                    className={`flex-row items-center gap-3 p-3 rounded-lg border ${isActive
                                            ? 'bg-[#FF6B35]/10 border-[#FF6B35]/30'
                                            : isPast
                                                ? 'bg-zinc-900/30 border-white/5'
                                                : 'bg-zinc-900/50 border-white/10'
                                        }`}
                                >
                                    <View className={`w-6 h-6 rounded-full items-center justify-center border ${isActive
                                            ? 'bg-[#FF6B35] border-[#FF6B35]'
                                            : isPast
                                                ? 'bg-zinc-700 border-zinc-700'
                                                : 'bg-zinc-800 border-zinc-700'
                                        }`}>
                                        {isPast ? (
                                            <Text className="text-zinc-500 text-xs">✓</Text>
                                        ) : isActive ? (
                                            <Text className="text-white text-xs font-bold">●</Text>
                                        ) : (
                                            <Text className="text-zinc-600 text-xs">{index + 1}</Text>
                                        )}
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`font-medium ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                                            {tier.name}
                                        </Text>
                                        {tier.remainingSlots !== undefined && (
                                            <Text className="text-zinc-600 text-xs">
                                                {tier.remainingSlots} slots available
                                            </Text>
                                        )}
                                    </View>
                                    <Text className={`font-black ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                                        ₹{tier.price}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Register Button */}
            {onRegister && (
                <TouchableOpacity
                    onPress={onRegister}
                    className={`py-4 rounded-xl items-center ${showUrgency
                            ? 'bg-orange-500 shadow-lg shadow-orange-500/30'
                            : 'bg-[#FF6B35] shadow-lg shadow-orange-500/20'
                        }`}
                >
                    <Text className="text-white font-black text-lg">
                        {showUrgency ? 'Grab Offer Before It Expires!' : 'Register Now'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

function formatTimeRemaining(expiresAt: string): string {
    const end = new Date(expiresAt).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

/**
 * Price Warning Banner - For showing inline warnings during checkout
 */
interface PriceWarningBannerProps {
    oldPrice: number;
    newPrice: number;
    ticketName: string;
    onDismiss?: () => void;
}

export const PriceWarningBanner: React.FC<PriceWarningBannerProps> = ({
    oldPrice,
    newPrice,
    ticketName,
    onDismiss,
}) => {
    const priceIncreased = newPrice > oldPrice;

    return (
        <View className={`flex-row items-start gap-3 p-4 rounded-xl border mb-4 ${priceIncreased
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-green-500/10 border-green-500/30'
            }`}>
            <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                    <AlertTriangle size={16} color={priceIncreased ? '#EF4444' : '#22C55E'} />
                    <Text className={`font-bold ${priceIncreased ? 'text-red-400' : 'text-green-400'}`}>
                        {priceIncreased ? 'Price Increased' : 'Price Dropped!'}
                    </Text>
                </View>
                <Text className="text-zinc-300 text-sm">
                    {ticketName}: ₹{oldPrice} → ₹{newPrice}
                </Text>
                {priceIncreased && (
                    <Text className="text-red-400 text-xs mt-1">
                        Price updated due to tier expiry. Proceed with new price?
                    </Text>
                )}
            </View>
            {onDismiss && (
                <TouchableOpacity onPress={onDismiss} className="p-1">
                    <Text className="text-zinc-500 font-bold">✕</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
