"use client";

import React from 'react';
import {Habit} from "@/lib/types"


interface HabitSelectorProps {
  habits: Habit[];
  selectedDate?: Date | null;
  onSelectHabit: (habitId: string) => void;
  onOpenCreateModal: () => void;
}

export const HabitSelector: React.FC<HabitSelectorProps> = ({ 
  habits, 
  selectedDate, 
  onSelectHabit, 
  onOpenCreateModal 
}) => {
  const isDateSelected = !!selectedDate;

  const getContrastingTextColor = (hexColor: string) => {
    // Remove leading hash if present
    let cleanHex = hexColor.replace(/^#/, '');

    // Convert 3-digit hex to 6-digit hex
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(char => char + char).join('');
    }

    // Parse r, g, b values
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // Calculate YIQ brightness ratio (weights human eye color perception)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Midpoint is 128. Greater means bright background (needs black text)
    return yiq >= 128 ? '#000000' : '#FFFFFF';
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto bg-white border-l border-gray-200 shadow-lg">
      {/* Sticky Header */}
      <div className="sticky top-0 p-6 bg-white border-b border-gray-100 z-10">
        <h2 className="text-2xl font-bold text-gray-900">
          {isDateSelected ? `Log for ${selectedDate.toLocaleDateString()}` : "Select a Date"}
        </h2>
        {!isDateSelected && (
          <p className="text-sm text-red-500 font-medium mt-1 italic">
            Please tap a date on the calendar first
          </p>
        )}
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh] bg-gray-50/50">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => isDateSelected && onSelectHabit(habit.id)}
            className={`
              w-full h-16 flex items-center px-6 rounded-xl border-2 transition-all duration-200 active:scale-95
              ${isDateSelected 
                ? "bg-white border-gray-200 shadow-sm" 
                : "bg-gray-100 border-transparent opacity-50 cursor-not-allowed"}
            `}
          >
            {/* Color Indicator based on the 'color' field in Prisma */}
            <div 
              className="mr-4 w-4 h-4 rounded-full border-2 border-current" 
              style={{ 
                backgroundColor: habit.color,
                borderColor: habit.color,
                color: getContrastingTextColor(habit.color),
              }} 
            />
            <span className="text-lg font-bold">{habit.name}</span>
          </button>
        ))}

        {/* "Add New" Action - Always visible to allow adding habits anytime */}
        <button
          onClick={onOpenCreateModal}
          className="w-full h-16 mt-4 px-6 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 font-bold text-lg hover:bg-blue-100 transition-colors"
        >
          + Add
        </button>
      </div>
    </div>
  );
};