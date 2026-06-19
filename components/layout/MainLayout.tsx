'use client';

import React, { useState } from 'react';
import CalendarGrid from '../calendar/CalendarGrid';
import { getAllHabits, getLocalCache } from '@/services/localData';
import { Habit, Log } from '@/lib/types';
import { HabitSelector } from '../habits/HabitSelector';
import FilterBar from '../habits/FilterBar';

export default function MainLayout({ children }: { children?: React.ReactNode }) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [habits, setHabits] = useState<Habit[]>(() => { return getAllHabits(); });
    const [logs, setLogs] = useState<Log[]>(() => { return getLocalCache(); });
    const [habitFilter, setHabitFilter] = useState<Habit[]>(habits);

    // Logic to filter logs based on the current selection from the FilterBar
    const filteredLogs = logs.filter(log =>
        habitFilter.some(h => h.id === log.habitId)
    );

    const onSelectHabit = (habitId: string) => {
        // open modal to log the habit
        return habitId;
    }

    const openCreateHabitModal = () => {
        // open modal to create a new habit
        return
    }


    return (
        // Flex container: Column by default (portrait), Row on large screens (landscape)
        <main className="h-dvh w-full bg-slate-50 overflow-hidden flex flex-col lg:flex-row">
            
            {/* Main Content Area (Calendar) */}
            {/* flex-1 makes this take up all available space. min-h-0 and min-w-0 prevent overflow bugs */}
            <section className="flex-1 flex flex-col min-h-0 min-w-0 p-1 bg-white border-b lg:border-b-0 lg:border-r border-gray-200">
                <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
                    <h1 className="text-3xl font-bold text-blue-600 mb-2 shrink-0">Kid&apos;s Tracker</h1>
                    
                    <div className="shrink-0 mb-1">
                        <FilterBar habits={habits} onFilterChange={(filtered) => setHabitFilter(filtered)} />
                    </div>
                    
                    {/* The calendar container safely fills the remaining space */}
                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
                        {children || <CalendarGrid logs={filteredLogs} habits={habitFilter} selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>}
                    </div>
                </div>
            </section>

            {/* Side Panel (Habit Menu) */}
            {/* w-full in portrait, fixed width (lg:w-80 or w-96) in landscape. shrink-0 prevents it from being squished */}
            <aside className="w-full lg:w-80 xl:w-96 shrink-0  p-1 flex flex-col min-h-0 max-h-[35vh] lg:max-h-none overflow-hidden">
                <div className="flex-1 w-full overflow-y-auto pr-2 rounded-xl">
                    <HabitSelector 
                        habits={habits} 
                        onSelectHabit={onSelectHabit} 
                        selectedDate={selectedDate} 
                        onOpenCreateModal={openCreateHabitModal} 
                    />
                </div>
            </aside>

            {/* Global Overlay/Notices */}
            <div className="fixed bottom-4 right-4 bg-white px-3 py-1 rounded-full shadow-md border border-gray-200 text-xs font-medium z-50">
                Status: Online
            </div>
        </main>
    );
}

