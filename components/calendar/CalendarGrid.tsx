'use client';

import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  isSameMonth, 
  isSameDay
} from 'date-fns';
import {Log, Habit} from "@/lib/types"
import { getContrastingTextColor } from '@/lib/utils/utils';

// Define types for our data structure
// interface Log {
//   id: string;
//   habitId: string;
//   timestamp: Date,
//   description: string,
//   scaleValue: number,
// }
interface CalendarGridProps {
  logs: Log[];
  setSelectedDate: (date: Date) => void;
  selectedDate: Date;
  habits: Habit[];
}

// Helper to get compact text (first emoji or character) of a name
const getCompactName = (name?: string) => {
  if (!name) return "";
  try {
    const segmenter = new Intl.Segmenter();
    const segments = Array.from(segmenter.segment(name));
    return segments[0]?.segment || name.charAt(0);
  } catch (e) {
    return name.charAt(0);
  }
};

export default function CalendarGrid({ logs, habits, selectedDate, setSelectedDate}: CalendarGridProps) {

  // State for navigation (Month/Year)
  const [viewDate, setViewDate] = useState(selectedDate);

  /**
   * Generates an array of 42 consecutive days starting from the 
   * Sunday before the first day of the current month.
   * This ensures a consistent 6-row grid regardless of how many 
   * days are in the month or what day it starts on.
   */
  const getDaysArray = () => {
    const firstDayOfMonth = startOfMonth(viewDate);
    // Get day of week (0 is Sunday, 1 is Monday...)
    const dayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate the date of the Sunday before or on the 1st
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = getDaysArray();

  const nextMonth = () => setViewDate(addMonths(viewDate, 1));
  const prevMonth = () => setViewDate(subMonths(viewDate, 1));

  /**
   * Mock Data for demonstration.
   * In production, this will be replaced by a fetch from the database/cache.
   * 'mockLogs' would contain logs filtered for the current view.
   */
  // const mockLogs: Log[] = [
  //     { userId: '1', id: '1', habitId: 'h1', description: "", scaleValue: 5, timestamp: new Date()},
  //     { userId: '1', id: '3', habitId: 'h3', description: "", scaleValue: 3, timestamp: new Date() },
  //     { userId: '1', id: '5', habitId: 'h5', description: "", scaleValue: 4, timestamp: new Date() },
  //     { userId: '1', id: '4', habitId: 'h4', description: "", scaleValue: 5, timestamp: new Date()},
  //     { userId: '1', id: '2', habitId: 'h2',  description: "", scaleValue: 5, timestamp: new Date()},
  // ];

  // Helper to determine if a specific day has logs and return them
    const getLogsForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return logs.map(log => {
      // Wrap in new Date() to ensure it's a Date object even if it's currently a string
      const timestamp = new Date(log.timestamp);
      return timestamp.toISOString().split('T')[0] === dateKey ? log : null;
    }).filter(Boolean);
  };

//   const habitColor = (habitId: string) => {
//     const habit = getAllHabits().find((habit) => habit.id === habitId);
//     if(habit){
//         return habit.color;
//     }else{return "#FFF"}
//   }

  return (
    <div className="calendar-container h-full w-full rounded-xl shadow-lg z-10 overflow-hidden flex flex-col glass-style-light">
      
      {/* Header Section (Month/Year Navigation) */}
      <div className="flex items-center justify-between p-2 shrink-0 rounded-t-xl glass-style">
        <button onClick={prevMonth} className="p-2 shadow-[inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_6px_rgba(255,255,255,0.4)] bg-[#ffb7d582] rounded-full  transition-all active:scale-90" aria-label="Previous Month">
          <svg className="w-6 h-6" fill="none" stroke="#44b3e9" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-800">{format(viewDate, 'MMMM yyyy')}</h2>
        <button onClick={nextMonth} className="p-2 bg-[#ffb7d583] rounded-full shadow-[inset_-2px_-2px_8px_rgba(0,0,0,0.2),inset_2px_2px_6px_rgba(255,255,255,0.4)] transition-all active:scale-90" aria-label="Next Month"><span></span>
          <svg className="w-6 h-6" fill="none" stroke="#44b3e9" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>        </button>
      </div>

      {/* Days of the Week Row */}
      <div className="grid grid-cols-7 shrink-0 glass-style text-gray-800 ">
        {['S','M','T','W','T','F','S'].map((day, i) => (
          <div key={i} className="text-[10px] font-bold text-center py-2">
            {day}
          </div>
        ))}
      </div>

      {/* The Date Boxes Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px min-h-0">
        
        {days.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, viewDate);
          const isSelected = isSameDay(date, selectedDate);
          const logsForDay = getLogsForDay(date);
          const hasLogs = logsForDay.length > 0;

          return (
            <div
              key={index}
              onClick={() => {setSelectedDate(date)}}
              className={`
                flex flex-col items-center p-1 cursor-pointer transition-all min-h-0
                overflow-x-hidden bg-[#ffffff2c]
                ${isSelected ? 'shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.3)] z-10 bg-[#ffffff41]' : ' active:scale-95'}
              `}
            >
              <span className={`lg:text-lg md:text-md text-sm font-semibold shrink-0 ${isCurrentMonth ? 'text-gray-800' : 'text-gray-300'}`}>
                {format(date, 'd')}
              </span>
              
              {/* The Summary Bar for multi-logs */}
              {hasLogs && (
                <>
                  {/* Full Text View (min-width: 600px container width) */}
                  <div className="calendar-full-view w-full mt-1 flex flex-col gap-1">
                    {Array.from(new Set(logsForDay.filter(log => log !== null).map(log => log.habitId))).map(habitId => {
                      const habitLogs = logsForDay.filter(log => log !== null && log.habitId === habitId); 
                      const totalLogs = habitLogs.length;
                      const habit = habits.find(h => h.id === habitId);
                      
                      return (
                        <div 
                          key={habitId} 
                          className="w-full rounded-md px-1 py-0.5 flex flex-col items-center shrink-0" 
                          style={{ backgroundColor: habit?.color || '#eee', color: getContrastingTextColor(habit!.color) }}
                        >
                          <span className="text-[9px] font-bold leading-tight text-center w-full truncate">
                            {habit?.name} {totalLogs > 1 && `(${totalLogs})`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Compact Badge View (< 600px container width) */}
                  <div className="calendar-compact-view w-full mt-1 flex flex-row flex-wrap justify-center gap-1.5">
                    {Array.from(new Set(logsForDay.filter(log => log !== null).map(log => log.habitId))).map(habitId => {
                      const habitLogs = logsForDay.filter(log => log !== null && log.habitId === habitId); 
                      const totalLogs = habitLogs.length;
                      const habit = habits.find(h => h.id === habitId);
                      const compactText = getCompactName(habit?.name);
                      
                      return (
                        <div 
                          key={habitId} 
                          className="relative rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs font-bold shadow-sm" 
                          style={{ backgroundColor: habit?.color || '#eee', color: getContrastingTextColor(habit!.color) }}
                          title={`${habit?.name}${totalLogs > 1 ? ` (${totalLogs})` : ''}`}
                        >
                          <span className="scale-90">{compactText}</span>
                          {totalLogs > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[8px] font-extrabold w-4 h-4 flex items-center justify-center border border-white z-20">
                              {totalLogs}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

}

