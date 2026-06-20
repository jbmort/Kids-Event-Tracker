'use client';

import React, { useEffect, useState } from 'react';
import CalendarGrid from '../calendar/CalendarGrid';
import { submitHabit, submitLog, getAllHabits, getAllLogCache, hasSuccessfulSync, isOnline, attemptBackgroundSync, pullDataFromServer } from '@/services/localData';
import { Habit, Log } from '@/lib/types';
import { HabitSelector } from '../habits/HabitSelector';
import FilterBar from '../habits/FilterBar';
import AddHabitModal from '../modals/addHabitModal';
import LoggingModal from '../modals/loggingModal';

export default function MainLayout({ children }: { children?: React.ReactNode }) {
    const USER_ID = '1';
    const [isMounted, setIsMounted] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [habitFilter, setHabitFilter] = useState<Habit[]>([]);
    
    const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [selectedHabitForLog, setSelectedHabitForLog] = useState<Habit | null>(null);
    const [activeFilter, setActiveFilter] = useState<boolean>(false);


    // Sync Logic Implementation
    useEffect(() => {
        // Load data from localStorage
        const loadedHabits = getAllHabits();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHabits(loadedHabits);
        setHabitFilter(loadedHabits);
        setLogs(getAllLogCache());
        // We are officially mounted on the iPad!
        setIsMounted(true);
        
       const initializeSync = async () => {
        await attemptBackgroundSync();
        
        const freshData = await pullDataFromServer(USER_ID);
        
        if (freshData?.habits !== habits || freshData?.logs !== logs) {
            if(freshData?.habits){
                setHabits(freshData.habits);
                setHabitFilter(freshData.habits); 
            }else if(freshData?.logs){
                setLogs(freshData.logs);
            } 
        }
        };

         // Sync Logic
        initializeSync();
        window.addEventListener('online', attemptBackgroundSync);
        
        return () => {
            window.removeEventListener('online', attemptBackgroundSync);
        };
    }, []);

    // Logic to filter logs based on the current selection from the FilterBar
    const filteredLogs = logs.filter(log =>
        habitFilter.some(h => h.id === log.habitId)
    );

    const isServerConnected = isOnline() && hasSuccessfulSync();

    const selectHabit = (habit: Habit) => {
      setSelectedHabitForLog(habit);
      setIsLogModalOpen(true);
    }

    const toggleFilter = () => {
        setActiveFilter(!activeFilter);
    }

     const handleAddHabitSuccess = async (newHabit: Habit) => {
        await submitHabit(newHabit);
        setHabits((prev) => [...prev, newHabit]);
        setHabitFilter(habits);
        setIsAddHabitModalOpen(false);
    };

     const handleLogSuccess = async (newLog: Log) => {
        await submitLog(newLog);
        setLogs((prev) => [...prev, newLog]);
        setIsLogModalOpen(false);
        setSelectedHabitForLog(null);
    };

    if (!isMounted) {
        return (
            <main className="h-dvh w-full bg-slate-50 flex items-center justify-center">
                <div className="text-blue-500 text-xl font-bold animate-pulse">
                    Loading Journal...
                </div>
            </main>
        );
    }

    return (
        // Flex container: Column by default (portrait), Row on large screens (landscape)
        <main className="h-dvh w-full bg-slate-50 overflow-hidden flex flex-col lg:flex-row">
            
            {/* Main Content Area (Calendar) */}
            {/* flex-1 makes this take up all available space. min-h-0 and min-w-0 prevent overflow bugs */}
            <section className="flex-1 flex flex-col min-h-0 min-w-0 p-1 bg-white border-b lg:border-b-0 lg:border-r border-gray-200">
                <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
                    <div className='flex flex-row justify-between'>
                    <h1 className="text-3xl font-bold text-blue-600 mb-2 shrink-0">Body Journal</h1>
                    <button
                        onClick={toggleFilter}
                        className="w-fit max-w-fit h-10 px-2 m-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 font-bold text-lg hover:bg-blue-100 transition-colors"
                    >
                        Filter
                    </button>
                    </div>
                    { activeFilter &&
                    <div className="shrink-0 mb-1">
                        <FilterBar habits={habits} onFilterChange={(filtered) => setHabitFilter(filtered)} />
                    </div> 
                    }
                   
                    
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
                        onSelectHabit={selectHabit} 
                        selectedDate={selectedDate} 
                        onOpenCreateModal={() => setIsAddHabitModalOpen(true)} 
                    />
                </div>
            </aside>

             {/* Add Habit Modal Overlay */}
            {isAddHabitModalOpen && (
                <AddHabitModal 
                    onSuccess={handleAddHabitSuccess} 
                    onClose={() => setIsAddHabitModalOpen(false)} 
                />
            )}

            {isLogModalOpen && selectedHabitForLog && (
                <LoggingModal 
                    habit={selectedHabitForLog}
                    userId={USER_ID} // Replace with actual auth logic if needed
                    timestamp={selectedDate}
                    onSuccess={handleLogSuccess}
                    onClose={() => {
                        setIsLogModalOpen(false);
                        setSelectedHabitForLog(null);
                    }} 
                />
            )}

            {/* Global Overlay/Notices */}
            <div className={`fixed bottom-4 right-4 px-3 py-1 rounded-full shadow-md border border-gray-200 text-xs font-medium z-50 ${
                isServerConnected ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white text-gray-400 border-gray-200'
            }`}>                Status: {isServerConnected ? 'Connected' : 'Offline'}
            </div>
        </main>
    );
}

