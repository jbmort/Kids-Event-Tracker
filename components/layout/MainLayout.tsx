'use client';

import React, { useState } from 'react';
import CalendarGrid from '../calendar/CalendarGrid';
import { getAllHabits, getLocalCache } from '@/services/localData';
import { Habit, Log } from '@/lib/types';
import { HabitSelector } from '../habits/HabitSelector';


export default function MainLayout({ children }: { children?: React.ReactNode }) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [habits, setHabits] = useState<Habit[]>(()=> {return getAllHabits()});
    const [logs, setLogs] = useState<Log[]>(() => {return getLocalCache()});

    const onSelectHabit = (habitId: string) => {
        // open modal to log the habit
        return habitId;
    }

    const openCreateHabitModal = () => {
        // open modal to create a new habit
        return
    }


  return (
    <main className="min-h-screen bg-slate-50">
      {/* 
          The layout uses a grid for Landscape (lg:) and a flex column for Portrait.
          In landscape, the calendar takes ~75% of width, habit menu takes ~25

  return (
    <main className="min-h-screen bg-slate-50">
      {/* 
          The layout uses a grid for Landscape (lg:) and a flex column for Portrait.
          In landscape, the calendar takes ~75% of width, habit menu takes ~25%.
      In portrait, we stack them.
      We add "max-w-full" to ensure it fills the mobile/tablet screen entirely.
      The 'p-4' provides a safe gutter for touch interactions.
      */}

      <div className="grid grid-cols-1 lg:grid-cols-[3fr,1fr] h-screen w-full overflow-hidden">
        {/* Main Content Area (Calendar) */}
        <section className="overflow-y-auto p-4 border-r border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-blue-600 mb-4">Kid&apos;s Tracker</h1>
            {children || <CalendarGrid logs={logs} habits={habits} selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>}
          </div>
        </section>

        {/* Side Panel (Habit Menu) - Visible on larger screens */}
        <aside className="bg-slate-50 p-4 flex flex-col justify-between border-l border-gray-200">
          <div className="flex-1 overflow-y-auto">
            {/* 
              In Portrait mode, this 'aside' will appear below the calendar 
              if we adjust the grid logic or use a standard flex wrapper.
            */}
            <HabitSelector habits={habits} onSelectHabit={onSelectHabit} selectedDate={selectedDate} onOpenCreateModal={openCreateHabitModal} />
          </div>
        </aside>

      {/* Global Overlay/Notices (e.g., Sync Status) */}
      <div className="fixed bottom-4 right-4 bg-white px-3 py-1 rounded-full shadow-md border border-gray-200 text-xs font-medium">
        {/* This will eventually show "Synced" or "Unsynced (x)" */}
        Status: Online
      </div>
      </div>
    </main>
  );
}