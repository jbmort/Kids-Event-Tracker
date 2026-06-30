'use client';

// Next.js Rule #1: Why we are using a Client Component
// This component must run on the client side because:
// 1. It accesses client-side APIs (localStorage via our localData services) to fetch local habits and logs.
// 2. It manages interactive state for selection tabs (Overview vs. specific habits).
// 3. It prevents server-side hydration mismatches by ensuring data is only rendered after mounting in the browser.

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getAllHabits, getAllLogCache } from '@/services/localData';
import { Habit, Log } from '@/lib/types';

export default function TrendsPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [selectedTab, setSelectedTab] = useState<string>('overview');
    const [breakdownTimeframe, setBreakdownTimeframe] = useState<'week' | 'month' | 'threeMonths' | 'all'>('all');

    // Load local storage habits and logs cache on client mount
    useEffect(() => {
        setHabits(getAllHabits());
        setLogs(getAllLogCache());
        setIsMounted(true);
    }, []);

    // Helper to calculate contrasting text colors for habit tag buttons
    const getContrastingTextColor = (hexColor: string) => {
        let cleanHex = hexColor.replace(/^#/, '');
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(char => char + char).join('');
        }
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq >= 128 ? '#000000' : '#FFFFFF';
    };

    // Computations based on data
    const activeHabit = useMemo(() => {
        return habits.find(h => h.id === selectedTab);
    }, [habits, selectedTab]);

    const activeLogs = useMemo(() => {
        if (selectedTab === 'overview') return logs;
        return logs.filter(l => l.habitId === selectedTab);
    }, [logs, selectedTab]);

    // Filter logs based on selected breakdown timeframe
    const filteredBreakdownLogs = useMemo(() => {
        if (breakdownTimeframe === 'all') return logs;

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        if (breakdownTimeframe === 'week') {
            return logs.filter(l => new Date(l.timestamp) >= oneWeekAgo);
        } else if (breakdownTimeframe === 'month') {
            return logs.filter(l => new Date(l.timestamp) >= oneMonthAgo);
        } else {
            return logs.filter(l => new Date(l.timestamp) >= threeMonthsAgo);
        }
    }, [logs, breakdownTimeframe]);

    // Calculate logs count per habit for Overview based on timeframe-filtered logs
    const logsCountPerHabitFiltered = useMemo(() => {
        const counts: Record<string, number> = {};
        habits.forEach(h => {
            counts[h.id] = filteredBreakdownLogs.filter(l => l.habitId === h.id).length;
        });
        return counts;
    }, [habits, filteredBreakdownLogs]);

    // Average scale value computation (scale values are 1-10)
    const averageScaleValue = useMemo(() => {
        const logsWithScale = activeLogs.filter(l => l.scaleValue !== null && l.scaleValue !== undefined);
        if (logsWithScale.length === 0) return 'N/A';
        const sum = logsWithScale.reduce((acc, log) => acc + (log.scaleValue || 0), 0);
        return (sum / logsWithScale.length).toFixed(1);
    }, [activeLogs]);

    // Calculate average logs per week over past month & past 3 months starting from earliest log
    const avgLogsPerWeek = useMemo(() => {
        if (selectedTab === 'overview' || activeLogs.length === 0) {
            return { oneMonth: '0.0', threeMonths: '0.0' };
        }

        const now = new Date();
        const earliestLogTime = Math.min(...activeLogs.map(l => new Date(l.timestamp).getTime()));
        const weeksSinceEarliest = Math.max((now.getTime() - earliestLogTime) / (1000 * 60 * 60 * 24 * 7), 0.1428); // minimum 1 day

        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        const logs1Month = activeLogs.filter(l => new Date(l.timestamp) >= oneMonthAgo).length;
        const logs3Months = activeLogs.filter(l => new Date(l.timestamp) >= threeMonthsAgo).length;

        const divisor1Month = Math.min(weeksSinceEarliest, 30 / 7);
        const divisor3Months = Math.min(weeksSinceEarliest, 90 / 7);

        return {
            oneMonth: (logs1Month / divisor1Month).toFixed(1),
            threeMonths: (logs3Months / divisor3Months).toFixed(1)
        };
    }, [activeLogs, selectedTab]);

    // Calculate average rating over past week, past month, and past 3 months
    const avgRatingsByPeriod = useMemo(() => {
        if (selectedTab === 'overview' || activeLogs.length === 0) {
            return { oneWeek: 'N/A', oneMonth: 'N/A', threeMonths: 'N/A' };
        }

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        const ratedLogs = activeLogs.filter(l => l.scaleValue !== null && l.scaleValue !== undefined);

        const getAvgForLogs = (filteredLogs: Log[]) => {
            if (filteredLogs.length === 0) return 'N/A';
            const sum = filteredLogs.reduce((acc, log) => acc + (log.scaleValue || 0), 0);
            return (sum / filteredLogs.length).toFixed(1);
        };

        return {
            oneWeek: getAvgForLogs(ratedLogs.filter(l => new Date(l.timestamp) >= oneWeekAgo)),
            oneMonth: getAvgForLogs(ratedLogs.filter(l => new Date(l.timestamp) >= oneMonthAgo)),
            threeMonths: getAvgForLogs(ratedLogs.filter(l => new Date(l.timestamp) >= threeMonthsAgo))
        };
    }, [activeLogs, selectedTab]);

    const gradientBgStyle = {
        backgroundColor: '#ecadda',
        backgroundImage: 'linear-gradient(90deg, rgba(204, 120, 235, 1) 0%, rgba(47, 224, 237, 1) 46%, rgba(255, 136, 0, 1) 100%)',
    };

    if (!isMounted) {
        return (
            <main className="h-dvh w-full bg-slate-50 flex items-center justify-center" style={gradientBgStyle}>
                <div className="text-white text-2xl font-bold animate-pulse glass-style p-6 rounded-2xl">
                    Loading Analytics... 📈
                </div>
            </main>
        );
    }

    return (
        <main className="relative h-dvh w-full overflow-hidden flex flex-col p-4 md:p-6" style={gradientBgStyle}>
            {/* Header Area */}
            <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 shrink-0">
                <Link
                    href="/"
                    className="min-h-12 w-full sm:w-auto px-6 py-2.5 rounded-xl border border-white/20 text-[#3e22f49a] font-bold text-lg glass-style transition-all hover:bg-white/20 active:scale-95 shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
                >
                    📅 Back to calendar
                </Link>
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#3e22f49a] tracking-wide drop-shadow-sm text-center">
                    Trends & Analytics 📈
                </h1>
                {/* Spacer to align header elements on large screens */}
                <div className="hidden sm:block w-45" />
            </header>

            {/* Horizontal Selector Container (similar to FilterBar) */}
            <div className="w-full flex flex-row overflow-x-auto items-center gap-3 p-3 rounded-2xl border border-white/10 shadow-md mb-6 glass-style scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
                {/* Overview Button */}
                <button
                    onClick={() => setSelectedTab('overview')}
                    className={`px-5 py-2.5 rounded-full font-bold transition-all active:scale-95 shrink-0 text-md shadow-sm border border-white/10 ${
                        selectedTab === 'overview'
                            ? 'bg-[#3e22f49a] text-white ring-3 ring-offset-2 ring-[#3e22f49a]'
                            : 'bg-white/15 text-slate-800 hover:bg-white/25'
                    }`}
                >
                    ✨ Overview
                </button>

                {/* Habit Buttons */}
                {habits.map((habit) => (
                    <button
                        key={habit.id}
                        onClick={() => setSelectedTab(habit.id)}
                        style={{
                            backgroundColor: habit.color,
                            color: getContrastingTextColor(habit.color)
                        }}
                        className={`px-5 py-2.5 rounded-full font-bold transition-all active:scale-95 shrink-0 text-md shadow-sm ${
                            selectedTab === habit.id
                                ? 'ring-3 ring-offset-2 ring-[#3e22f49a] scale-105'
                                : 'opacity-85 hover:opacity-100'
                        }`}
                    >
                        {habit.name}
                    </button>
                ))}
            </div>

            {/* Main Portion: Data Overview Cards */}
            <section className="flex-1 min-h-0 overflow-y-auto bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-inner">
                {selectedTab === 'overview' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Summary Card 1 */}
                        <div className="glass-style-light p-6 rounded-2xl border border-white/20 shadow-md flex flex-col justify-between min-h-36">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700/80 mb-2">Total Habits Logged</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-[#3e22f4c9]">{habits.length}</span>
                                <span className="text-xl text-slate-600">habits</span>
                            </div>
                        </div>

                        {/* Summary Card 2 */}
                        <div className="glass-style-light p-6 rounded-2xl border border-white/20 shadow-md flex flex-col justify-between min-h-36">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700/80 mb-2">Total Entries Recorded</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-[#3e22f4c9]">{logs.length}</span>
                                <span className="text-xl text-slate-600">logs</span>
                            </div>
                        </div>

                        {/* Summary Card 3 */}
                        <div className="glass-style-light p-6 rounded-2xl border border-white/20 shadow-md flex flex-col justify-between min-h-36">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700/80 mb-2">Average Rating (All)</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-[#3e22f4c9]">{averageScaleValue}</span>
                                <span className="text-xl text-slate-600">/ 10</span>
                            </div>
                        </div>

                        {/* Habits Log Breakdown */}
                        <div className="md:col-span-2 glass-style-light p-6 rounded-2xl border border-white/20 shadow-md">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                                <h3 className="text-lg font-bold text-[#3e22f4a9]">Habit Breakdown</h3>
                                <div className="flex gap-1 bg-white/10 p-0.5 rounded-xl border border-white/10 overflow-x-auto max-w-full">
                                    {(['week', 'month', 'threeMonths', 'all'] as const).map((tf) => {
                                        const labels = {
                                            week: 'Week',
                                            month: 'Month',
                                            threeMonths: '3 Months',
                                            all: 'All Time',
                                        };
                                        return (
                                            <button
                                                key={tf}
                                                onClick={() => setBreakdownTimeframe(tf)}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                                                    breakdownTimeframe === tf
                                                        ? 'bg-[#3e22f49a] text-white shadow-sm'
                                                        : 'text-slate-700 hover:bg-white/15'
                                                }`}
                                            >
                                                {labels[tf]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {habits.length === 0 ? (
                                <p className="text-slate-600 font-medium text-center py-6">No habits created yet. Go back and add some! ✍️</p>
                            ) : (
                                <div className="space-y-4">
                                    {habits.map(h => {
                                        const count = logsCountPerHabitFiltered[h.id] || 0;
                                        const totalCount = filteredBreakdownLogs.length;
                                        const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
                                        return (
                                            <div key={h.id} className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ backgroundColor: h.color }} />
                                                        {h.name}
                                                    </span>
                                                    <span className="text-slate-700">{count} log{count !== 1 ? 's' : ''} ({percent.toFixed(0)}%)</span>
                                                </div>
                                                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: h.color, width: `${percent}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Recent Activity Feed */}
                        <div className="glass-style-light p-6 rounded-2xl border border-white/20 shadow-md flex flex-col">
                            <h3 className="text-lg font-bold text-[#3e22f4a9] mb-4">Recent Activity</h3>
                            {logs.length === 0 ? (
                                <p className="text-slate-600 font-medium text-center py-6">No logs recorded yet. Start tracking on the calendar! 📝</p>
                            ) : (
                                <div className="space-y-3 overflow-y-auto max-h-85 pr-1">
                                    {logs.slice(-5).reverse().map(l => {
                                        const habit = habits.find(h => h.id === l.habitId);
                                        const date = new Date(l.timestamp);
                                        return (
                                            <div key={l.id} className="p-3 bg-white/25 rounded-xl border border-white/10 flex flex-col gap-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-extrabold flex items-center gap-1.5">
                                                        {habit ? (
                                                            <>
                                                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: habit.color }} />
                                                                {habit.name}
                                                            </>
                                                        ) : 'Unknown'}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-700/80">
                                                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                {l.scaleValue !== null && (
                                                    <span className="text-xs font-bold text-slate-800">
                                                        ⭐ Value: {l.scaleValue} / 10
                                                    </span>
                                                )}
                                                {l.description && (
                                                    <p className="text-xs italic text-slate-600 line-clamp-2">
                                                        "{l.description}"
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Habit Specific Detail Tab
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Habit Profile Card */}
                        <div className="glass-style-light p-6 rounded-2xl border border-white/20 shadow-md">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-6 h-6 rounded-full inline-block shadow-sm" style={{ backgroundColor: activeHabit?.color }} />
                                <h2 className="text-2xl font-black text-slate-800">{activeHabit?.name}</h2>
                            </div>
                            <div className="space-y-3 text-sm font-semibold text-slate-700">
                                <div className="flex justify-between py-2 border-b border-white/10 items-center">
                                    <span>Total Entries:</span>
                                    <span className="font-extrabold text-[#3e22f4c9] text-base">{activeLogs.length}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/10">
                                    <span>Avg per week:</span>
                                    <div className="flex gap-4 text-right">
                                        <div>
                                            <div className="text-[9px] uppercase font-black text-slate-500/80">Past Month</div>
                                            <span className="font-extrabold text-[#3e22f4c9] text-base">{avgLogsPerWeek.oneMonth}</span>
                                        </div>
                                        <div className="text-slate-350 self-center select-none font-light">|</div>
                                        <div>
                                            <div className="text-[9px] uppercase font-black text-slate-500/80">Past 3 Months</div>
                                            <span className="font-extrabold text-[#3e22f4c9] text-base">{avgLogsPerWeek.threeMonths}</span>
                                        </div>
                                    </div>
                                </div>
                                {activeHabit?.scaleValues && activeHabit.scaleValues.length > 0 && (
                                    <>
                                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                                            <span>Avg rating:</span>
                                            <div className="flex gap-4 text-right">
                                                <div>
                                                    <div className="text-[9px] uppercase font-black text-slate-500/80">Past Week</div>
                                                    <span className="font-extrabold text-[#3e22f4c9] text-base">{avgRatingsByPeriod.oneWeek}</span>
                                                </div>
                                                <div className="text-slate-350 self-center select-none font-light">|</div>
                                                <div>
                                                    <div className="text-[9px] uppercase font-black text-slate-500/80">Past Month</div>
                                                    <span className="font-extrabold text-[#3e22f4c9] text-base">{avgRatingsByPeriod.oneMonth}</span>
                                                </div>
                                                <div className="text-slate-350 self-center select-none font-light">|</div>
                                                <div>
                                                    <div className="text-[9px] uppercase font-black text-slate-500/80">Past 3 Months</div>
                                                    <span className="font-extrabold text-[#3e22f4c9] text-base">{avgRatingsByPeriod.threeMonths}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between py-2 items-center">
                                            <span>Scale Values Allowed:</span>
                                            <span className="font-bold flex gap-1 flex-wrap justify-end max-w-[60%]">
                                                {activeHabit.scaleValues.map((v, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-white/20 rounded text-xs">{v}</span>
                                                ))}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Future Analytics Placeholder card */}
                        <div className="glass-style-light p-6 rounded-2xl border border-white/20 shadow-md flex flex-col justify-center items-center text-center min-h-55">
                            <span className="text-4xl mb-3">🛠️</span>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Analytics Coming Soon!</h3>
                            <p className="text-sm text-slate-600 max-w-sm">
                                Future calculations like trends graphs, weekly averages, and sleep correlation analysis will be placed here.
                            </p>
                            <div className="mt-4 px-4 py-2 bg-white/30 rounded-xl border border-white/15 text-xs font-bold text-[#3e22f4]">
                                Ready for Calculations: {activeLogs.length} logs & all habit parameters are connected!
                            </div>
                        </div>

                        {/* Log History list for this habit */}
                        <div className="md:col-span-2 glass-style-light p-6 rounded-2xl border border-white/20 shadow-md">
                            <h3 className="text-lg font-bold text-[#3e22f4a9] mb-4">Log Entries ({activeLogs.length})</h3>
                            {activeLogs.length === 0 ? (
                                <p className="text-slate-600 font-medium text-center py-6">No logs for this habit yet. Start tracking on the calendar! 📅</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-75 overflow-y-auto pr-1">
                                    {activeLogs.slice().reverse().map(l => {
                                        const date = new Date(l.timestamp);
                                        return (
                                            <div key={l.id} className="p-3.5 bg-white/25 rounded-xl border border-white/10 flex flex-col gap-1.5">
                                                <div className="flex justify-between items-center text-xs font-bold text-slate-700/80">
                                                    <span>{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                    <span>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                {activeHabit?.scaleValues && activeHabit.scaleValues.length > 0 && l.scaleValue !== null && (
                                                    <div className="text-sm font-extrabold text-slate-800">
                                                        ⭐ Rating: {l.scaleValue} / 10
                                                    </div>
                                                )}
                                                {l.description && (
                                                    <p className="text-xs italic text-slate-600 bg-white/10 p-2 rounded-lg border border-white/5 mt-1">
                                                        "{l.description}"
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
