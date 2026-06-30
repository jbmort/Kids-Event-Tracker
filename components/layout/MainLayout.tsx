'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CalendarGrid from '../calendar/CalendarGrid';
import { submitHabit, submitLog, getAllHabits, getAllLogCache, hasSuccessfulSync, isOnline, attemptBackgroundSync, pullDataFromServer } from '@/services/localData';
import { Habit, Log } from '@/lib/types';
import { HabitSelector } from '../habits/HabitSelector';
import FilterBar from '../habits/FilterBar';
import AddHabitModal from '../modals/addHabitModal';
import LoggingModal from '../modals/loggingModal';
import DailyLogDetails from '../dailyView/DailyLogDetails';
import { updateHabit } from '@/app/actions/habits';

// 1. Defining tab IDs and tabs in a clean configuration array makes this navigation bar
// extremely extensible. The user can easily add a new tab (e.g., 'trends') by adding
// an item to this array and updating the MobileTabId type.
export type MobileTabId = 'calendar' | 'logs';

export interface MobileTab {
    id: MobileTabId;
    label: string;
    icon: string;
}

export const MOBILE_TABS: MobileTab[] = [
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'logs', label: 'Log & Details', icon: '📝' },
];

export default function MainLayout({ children }: { children?: React.ReactNode }) {
    const USER_ID = '1';
    
    // 1. Add this state variable for server connection status
    const [isMounted, setIsMounted] = useState(false);
    const [isServerConnected, setIsServerConnected] = useState(false); // <-- CHANGE TO STATE

    // Initialize all states as empty
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [habitFilter, setHabitFilter] = useState<Habit[]>([]);
    const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [selectedHabitForLog, setSelectedHabitForLog] = useState<Habit | null>(null);
    const [activeFilter, setActiveFilter] = useState<boolean>(false);
    const [formHabit, setFormHabit] = useState<Habit | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<MobileTabId>('calendar');

    useEffect(() => {
        // Load data from localStorage safely inside the effect
        const loadedHabits = getAllHabits();
        setHabits(loadedHabits);
        setHabitFilter(loadedHabits);
        setLogs(getAllLogCache());
        
        // 2. NOW it is safe to check the network status and set the state!
        setIsServerConnected(isOnline() && hasSuccessfulSync());
        
        // We are officially mounted on the iPad!
        setIsMounted(true);
        
        const initializeSync = async () => {
            await attemptBackgroundSync();
            
            const freshData = await pullDataFromServer(USER_ID);
            
            // Check if server data actually differs before updating state (prevents infinite rerender loops)
            if (freshData) {
                if (JSON.stringify(freshData.habits) !== JSON.stringify(habits)) {
                    setHabits(freshData.habits);
                    setHabitFilter(freshData.habits); 
                }
                if (JSON.stringify(freshData.logs) !== JSON.stringify(logs)) {
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
    backgroundColor: '#ecadda',
    
    backgroundImage: 
    'linear-gradient(90deg,rgba(204, 120, 235, 1) 0%, rgba(47, 224, 237, 1) 46%, rgba(255, 136, 0, 1) 100%)',
    
    // 'conic-gradient(at 30% 40%, rgba(179, 115, 222, 0.91), rgba(191, 255, 251, 1), rgba(235, 120, 227, 1), rgba(179, 115, 222, 0.91))',
    
    // 'radial-gradient(at 30% 40%,rgba(179, 115, 222, 0.91) 28%, rgba(191, 255, 251, 1) 52%, rgba(235, 120, 227, 1) 100%)'

  };

    const filteredLogs: Log[] = useMemo(() => {
            return logs.filter(log =>
            habitFilter.some(h => h.id === log.habitId));
        }, [logs, habitFilter]);


    const selectHabit = (habit: Habit) => {
      setSelectedHabitForLog(habit);
      setIsLogModalOpen(true);
    }

    const toggleFilter = () => {
        setActiveFilter(!activeFilter);
    }

    const handleAddHabitSuccess = (newHabit: Habit, isNew: boolean) => {
        if (isNew) {
            submitHabit(newHabit);
        } else {
            updateHabit(newHabit.id, newHabit);
        }

        // 2. Compute the updated habits list immediately to avoid React state batching delays
        const updatedHabits = isNew
            ? [...habits, newHabit]
            : [...habits.filter((habit) => habit.id !== newHabit.id), newHabit];

        // 3. Update the UI states instantly
        setHabits(updatedHabits);
        setHabitFilter(updatedHabits);
        setIsAddHabitModalOpen(false);

        // 4. FIRE-AND-FORGET: Pull from server in the background.
        // We use .then() instead of await so the UI never blocks while waiting for the network!
        pullDataFromServer(USER_ID).then((freshData) => {
        if (freshData) {
            setHabits(freshData.habits);
            setHabitFilter(freshData.habits);
            setLogs(freshData.logs);
        }
    });
};

    const handleLogSuccess = (newLog: Log) => {
        submitLog(newLog);

        // Update UI states instantly
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
        // Flex container: Column by default (portrait), Row in landscape (both phone and tablet)
        <main className="relative h-dvh w-full overflow-hidden flex flex-col landscape:flex-row" style={divStyle} >
            
            {/* Mobile Top Header (visible only on vertical phone views when the logs overlay is active) */}
            <header className={`flex md:hidden landscape:hidden flex-col items-center justify-center py-2 px-4 shrink-0 w-full bg-white/10 backdrop-blur-md border-b border-white/10 text-center z-40 ${activeTab === 'logs' ? 'flex' : 'hidden'}`}>
                <h1 className="text-2xl font-bold text-[#3e22f49a] tracking-wide">Body Journal</h1>
                <p className="text-sm font-semibold text-slate-800/80 mt-0.5">
                    📅 {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </p>
            </header>

            {/* Main Content Area (Calendar) */}
            {/* On mobile, this will stay in the background under the Log overlay. On desktop/tablet, it is always inline. */}
            <section className="flex-1 flex flex-col min-h-0 ml-0 min-w-0 p-1 rounded-r-xl">
                <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
                    <div className='flex flex-row justify-between items-center'>
                    <h1 className="text-3xl font-bold text-[#3e22f49a] mb-1 ml-3 shrink-0">Body Journal</h1>
                    <div className="flex gap-2 items-center">
                        <Link
                            href="/trends"
                            className="w-fit max-w-fit h-10 px-3 py-1.5 rounded-xl border border-white/20 text-[#3e22f49a]
                             font-bold text-lg glass-style transition-all hover:bg-white/20 active:scale-95 shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.3)] flex items-center justify-center"
                        >
                            Trends 📈
                        </Link>
                        <button
                            onClick={toggleFilter}
                            className="w-fit max-w-fit h-10 px-3 py-1.5 rounded-xl border border-white/20 text-[#3e22f49a]
                             font-bold text-lg glass-style transition-all hover:bg-white/25 active:scale-95 shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.3)]"
                        >
                            Filter
                        </button>
                    </div>
                    </div>
                    { activeFilter &&
                    <div className="shrink-0 mb-1">
                        <FilterBar habits={habits} onFilterChange={(filtered) => setHabitFilter(filtered)} />
                    </div> 
                    }
                   
                    
                    {/* The calendar container safely fills the remaining space */}
                    <div className="flex-1 min-h-0 mb-1 overflow-hidden shadow-lg rounded-xl">
                        {children || <CalendarGrid logs={filteredLogs} habits={habitFilter} selectedDate={selectedDate} setSelectedDate={setSelectedDate}/>}
                    </div>
                </div>
            </section>

            {/* Side Panel (Habit Menu) */}
            {/* On mobile portrait: It renders as a modal sheet absolute-positioned on top of the calendar.
                On desktop/tablet & landscape views: It renders as a standard inline side panel. */}
            <aside className={`
                shrink-0 p-1.5 flex-col min-h-0 overflow-hidden z-30
                w-full landscape:w-80 landscape:xl:w-96 landscape:flex
                
                /* Mobile Portrait Overlay State */
                ${activeTab === 'logs' 
                    ? 'flex absolute inset-x-0 top-16 bottom-18 backdrop-blur-md p-4 animate-in fade-in slide-in-from-bottom-6 duration-200' 
                    : 'hidden md:flex'
                }
                
                /* Reset overlay behavior on tablet/desktop & landscape views */
                md:relative md:inset-x-auto md:top-auto md:bottom-auto md:bg-transparent md:backdrop-blur-none md:p-1 md:flex-initial md:max-h-1/4
                landscape:relative landscape:inset-x-auto landscape:top-auto landscape:bottom-auto landscape:bg-transparent landscape:backdrop-blur-none landscape:p-1 landscape:max-h-none
            `}>
                {/* Responsive container for sidebar contents:
                    - Stacks vertically on phone portrait (flex-col) inside a card overlay
                    - Arranges horizontally on iPad portrait (md:flex-row) to match the original iPad layout
                    - Stacks vertically in landscape (landscape:flex-col) as the sidebar is positioned side-by-side */}
                <div className="flex flex-col md:flex-row landscape:flex-col w-full h-full gap-3 md:gap-4 landscape:gap-3">
                    <div className="lg:flex-2 flex-1 w-full overflow-y-auto pr-2 rounded-xl p-1">
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

            {/* Mobile Navigation Tab Bar (visible only on mobile screen widths in portrait orientation) */}
            <nav className="flex md:hidden landscape:hidden shrink-0 w-full py-3 px-4 justify-around items-center z-40 ">
                {MOBILE_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 mx-1.5 rounded-xl transition-all duration-200 active:scale-95 border ${
                            activeTab === tab.id
                                ? 'bg-white/30 text-white border-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)] font-bold'
                                : 'bg-white/10 text-white/70 border-white/10 hover:text-white/90 hover:bg-white/15 font-medium'
                        }`}
                    >
                        <span className="text-xl mb-1">{tab.icon}</span>
                        <span className="text-xs">{tab.label}</span>
                    </button>
                ))}
                <Link
                    href="/trends"
                    className="flex-1 flex flex-col items-center justify-center py-1.5 px-3 mx-1.5 rounded-xl transition-all duration-200 active:scale-95 border bg-white/10 text-white/70 border-white/10 hover:text-white/90 hover:bg-white/15 font-medium"
                >
                    <span className="text-xl mb-1">📈</span>
                    <span className="text-xs">Trends</span>
                </Link>
            </nav>

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
            <div className={`fixed bottom-20 right-4 landscape:bottom-4 md:bottom-4 md:right-4 px-3 py-1 rounded-full shadow-md border border-gray-200 text-xs font-medium z-50 ${
                isServerConnected ? 'bg-[#6cff5969] border-green-500 text-green-700' : 'bg-[#ffffff67] text-gray-400 border-gray-200'
            }`}>{isServerConnected ? 'Connected' : 'Offline'}
            </div>
        </main>
    );
}


