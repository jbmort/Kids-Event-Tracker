'use client';

import React, { useEffect, useMemo, useState } from 'react';
import CalendarGrid from '../calendar/CalendarGrid';
import { submitHabit, submitLog, getAllHabits, getAllLogCache, hasSuccessfulSync, isOnline, attemptBackgroundSync, pullDataFromServer } from '@/services/localData';
import { Habit, Log } from '@/lib/types';
import { HabitSelector } from '../habits/HabitSelector';
import FilterBar from '../habits/FilterBar';
import AddHabitModal from '../modals/addHabitModal';
import LoggingModal from '../modals/loggingModal';
import DailyLogDetails from '../dailyView/DailyLogDetails';
import { updateHabit } from '@/app/actions/habits';

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
    const [formHabit, setFormHabit] = useState<Habit | undefined>(undefined);


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

    const divStyle = {
    // 1. Establish your base anchor color
    backgroundColor: '#ecadda',
    
    // 2. Layer subtle, highly-transparent rainbow accents on top
    backgroundImage: 
    
    // 'conic-gradient(at 30% 40%, rgba(179, 115, 222, 0.91), rgba(191, 255, 251, 1), rgba(235, 120, 227, 1), rgba(179, 115, 222, 0.91))',
    
    'radial-gradient(at 30% 40%,rgba(179, 115, 222, 0.91) 28%, rgba(191, 255, 251, 1) 52%, rgba(235, 120, 227, 1) 100%)',

  };

    const filteredLogs: Log[] = useMemo(() => {
            return logs.filter(log =>
            habitFilter.some(h => h.id === log.habitId));
        }, [logs, habitFilter]);

    const isServerConnected = isOnline() && hasSuccessfulSync();

    const selectHabit = (habit: Habit) => {
      setSelectedHabitForLog(habit);
      setIsLogModalOpen(true);
    }

    const toggleFilter = () => {
        setActiveFilter(!activeFilter);
    }

     const handleAddHabitSuccess = async (newHabit: Habit, isNew: boolean) => {
        if(isNew){
            await submitHabit(newHabit);
            setHabits((prev) => [...prev, newHabit]);
        }else{
            await updateHabit(newHabit.id, newHabit);
            const otherHabits = habits.filter((habit) => habit.id !== newHabit.id)
            setHabits([...otherHabits, ...[newHabit]]);
        }
        setHabitFilter(habits);
        setIsAddHabitModalOpen(false);
        await pullDataFromServer(USER_ID);
    };

     const handleLogSuccess = async (newLog: Log) => {
        await submitLog(newLog);
        setLogs((prev) => [...prev, newLog]);
        setIsLogModalOpen(false);
        setSelectedHabitForLog(null);
    };

    const openHabitModal = (habit: Habit | undefined) => {
        if(habit){
          setFormHabit(habit);
        }
        setIsAddHabitModalOpen(true);
    }

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
        <main className="h-dvh w-full  overflow-hidden flex flex-col lg:flex-row" style={divStyle} >
            
            {/* Main Content Area (Calendar) */}
            <section className="flex-1 flex flex-col min-h-0 ml-0 min-w-0 p-1  rounded-r-xl m-2  ">
                <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
                    <div className='flex flex-row justify-between'>
                    <h1 className="text-3xl font-bold text-[#3e22f49a] mb-1 ml-3 shrink-0">Body Journal</h1>
                    <button
                        onClick={toggleFilter}
                        className="w-fit max-w-fit h-10 px-2 m-2 rounded-xl border-blue-300 text-[#3e22f49a]
                         font-bold text-lg glass-style transition-colors shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.3)]"
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
                    <div className="flex-1 min-h-0 overflow-hidden shadow-lg rounded-xl">
                        {children || <CalendarGrid logs={filteredLogs} habits={habitFilter} selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>}
                    </div>
                </div>
            </section>

            {/* Side Panel (Habit Menu) */}
            {/* w-full in portrait, fixed width (lg:w-80 or w-96) in landscape. shrink-0 prevents it from being squished */}
            <aside className="w-full lg:w-80 xl:w-96 shrink-0 p-1 flex flex-col min-h-0 max-h-[35vh] lg:max-h-none overflow-hidden">                
                {/* <div className="flex-1 w-full overflow-y-auto pr-2 rounded-xl"> */}
                <div className="flex landscape:flex-col portrait:flex-row h-full">
                    <div className="landscape:flex-2 portrait:flex-1 w-full overflow-y-auto pr-2 rounded-xl p-1">
                        <HabitSelector 
                            openEditModal={openHabitModal}
                            habits={habits} 
                            setHabits={setHabits}
                            onSelectHabit={selectHabit} 
                            selectedDate={selectedDate} 
                            onOpenCreateModal={() => openHabitModal(undefined)} 
                        />
                    </div>

                    <div className="flex-1 w-full overflow-y-auto pr-2 rounded-xl p-1">
                        <DailyLogDetails logs={filteredLogs} habits={habits} currentDay={selectedDate} setLogs={setLogs} />
                    </div>
                </div>
            </aside>

             {/* Add Habit Modal Overlay */}
            {isAddHabitModalOpen && (
                <AddHabitModal 
                    habit={formHabit}
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
                isServerConnected ? 'bg-[#6cff5969] border-green-500 text-green-700' : 'bg-[#ffffff67] text-gray-400 border-gray-200'
            }`}>                Status: {isServerConnected ? 'Connected' : 'Offline'}
            </div>
        </main>
    );
}


