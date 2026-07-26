import React from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';

interface StatusPillRowProps {
    /** Gig type or eventFunction label, e.g. "Sangeet" or "Music recording" */
    typeLabel?: string;
    /** ISO date string of the application deadline. */
    applicationDeadline?: string | Date;
    /** Total number of applications received so far. */
    appliedCount?: number;
}

/**
 * Plan 5 — gig detail v2 status row. Three pills: gig type, deadline
 * countdown, and applied-count. Renders just under the title block,
 * before the producer card. No card chrome — just inline pills.
 *
 * Empty pills auto-hide so the row collapses cleanly when data is
 * missing (e.g. unset deadline, zero applicants).
 */

function formatDeadlineCountdown(deadline?: string | Date): string | null {
    if (!deadline) return null;
    const dl = new Date(deadline).getTime();
    if (!isFinite(dl)) return null;
    const now = Date.now();
    const ms = dl - now;
    if (ms < 0) return 'Closed';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days >= 1) return `Closes in ${days} ${days === 1 ? 'day' : 'days'}`;
    const hours = Math.max(1, Math.floor(ms / (1000 * 60 * 60)));
    return `Closes in ${hours}h`;
}

export const StatusPillRow: React.FC<StatusPillRowProps> = ({
    typeLabel,
    applicationDeadline,
    appliedCount,
}) => {
    const deadline = formatDeadlineCountdown(applicationDeadline);
    const showApplied =
        typeof appliedCount === 'number' && appliedCount > 0;
    const showType = !!typeLabel;
    const showDeadline = !!deadline;

    if (!showType && !showDeadline && !showApplied) return null;

    return (
        <View
            className="flex-row flex-wrap items-center gap-2 mb-4"
            testID="status-pill-row"
        >
            {showType ? (
                <View
                    className="px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.04]"
                    testID="status-pill-type"
                >
                    <Text className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
                        {typeLabel}
                    </Text>
                </View>
            ) : null}

            {showDeadline ? (
                <View
                    className="flex-row items-center gap-1 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10"
                    testID="status-pill-deadline"
                >
                    <Clock size={11} color="#F59E0B" />
                    <Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400">
                        {deadline}
                    </Text>
                </View>
            ) : null}

            {showApplied ? (
                <View
                    className="px-2.5 py-1 rounded-md border border-white/10 bg-white/5"
                    testID="status-pill-applied"
                >
                    <Text className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                        {appliedCount} applied
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
