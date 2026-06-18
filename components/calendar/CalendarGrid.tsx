import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  isSameMonth, 
  isSameDay
} from 'date-fns';
import { getAllHabits } from "@/services/localData"

// Define types for our data structure
interface Log {
  id: string;
  habitId: string;
  color: string; // The hex color of the habit (e.g., #3b82f6)
  timestamp: Date,
  description: string,
  scaleValue: number,
}

export default function CalendarGrid() {
  // State for navigation (Month/Year)
  const [viewDate, setViewDate] = useState(new Date());
  // State for selection (The day user clicked)
  const [selectedDate, setSelectedDate] = useState(new Date());

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
  const mockLogs: Log[] = [
      { id: '1', habitId: 'h1', color: '#3b82f6', description: "", scaleValue: 5, timestamp: new Date()},
      { id: '3', habitId: 'h3', color: '#22c55e', description: "", scaleValue: 3, timestamp: new Date()},
      { id: '4', habitId: 'h4', color: '#6b7280', description: "", scaleValue: 5, timestamp: new Date()},
      { id: '2', habitId: 'h2', color: '#ef4444', description: "", scaleValue: 5, timestamp: new Date()},
  ];

  // Helper to determine if a specific day has logs and return them
   const getLogsForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return mockLogs.map(log => log.timestamp.toISOString().split('T')[0] === dateKey ? log : null).filter(Boolean);
  };

  const habitColor = (habitId: string) => {
    const habit = getAllHabits().find((habit) => habit.id === habitId);
    if(habit){
        return habit.color;
    }else{return "#FFF"}
  }

  return (
    <div className="max-w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-slate-50">
        <button 
          onClick={prevMonth}
          className="p-2 hover:bg-white rounded-full shadow-sm transition-all active:scale-90"
          aria-label="Previous Month"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-xl font-bold text-gray-800">
          {format(viewDate, 'MMMM yyyy')}
        </h2>
        
        <button 
          onClick={nextMonth}
          className="p-2 hover:bg-white rounded-full shadow-sm transition-all active:scale-90"
          aria-label="Next Month"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-7 bg-gray-100 gap-px border-l border-r border-gray-200">
        {/* Day Labels */}
        {['S','M','T','W','T','F','S'].map((day, i) => (
          <div key={i} className="text-[10px] font-bold text-center py-2 bg-gray-50 text-gray-400">
            {day}
          </div>
        ))}

        {/* The Date Boxes */}
        {days.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, viewDate);
          const isSelected = isSameDay(date, selectedDate);
          const logs = getLogsForDay(date);
          const hasLogs = logs.length > 0;

          return (
            <div
              key={index}
              onClick={() => setSelectedDate(date)}
              className={`
                aspect-square flex flex-col items-center justify-center p-1 cursor-pointer transition-all
                ${!isCurrentMonth ? 'bg-gray-50 text-gray-300' : 'bg-white'}
                ${isSelected ? 'ring-4 ring-blue-400 z-10' : 'hover:bg-blue-50 active:scale-95'}
              `}
            >
              <span className={`text-lg font-semibold ${isCurrentMonth ? 'text-gray-800' : ''}`}>
                {format(date, 'd')}
              </span>
              
              {/* The Summary Bar for multi-logs */}
              {hasLogs && (
                <div className="w-full mt-1">
                  {Array.from(new Set(logs.filter(log => log !== null).map(log => log.habitId))).map(habitId => {
                    const habitLogs = logs.filter(log => log !== null && log.habitId === habitId);
                    return (
                      <div key={habitId} className="h-2 w-full rounded-full mb-0.5" style={{ backgroundColor: habitColor(habitId) }}>
                        {habitLogs.length > 1 && (
                    <span className="text-[8px] font-bold text-center mt-0.5">
                            {habitLogs.length}
                    </span>
                  )}
                </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        </div>
    </div>
  )}

//   need to implement calendar grid in main component and create the habit selector