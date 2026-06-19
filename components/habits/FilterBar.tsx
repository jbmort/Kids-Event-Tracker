"use client";

import React, { useState } from 'react';
import { Habit } from '@/lib/types';

interface FilterBarProps {
  habits: Habit[];
  onFilterChange: (filteredHabits: Habit[]) => void;
}

/**
 * A component that provides a row of buttons to filter habits.
 * Each button is colored based on the habit's specific color.
 * 
 * Why "use client": This component manages internal state for the 
 * active selection and responds immediately to user clicks.
 */
export default function FilterBar({ habits, onFilterChange }: FilterBarProps) {
  // State to track which button is currently selected ('all' or a specific habit ID)
  const [selectedId, setSelectedId] = useState<string | 'all'>('all');

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (id === 'all') {
      // If "All" is selected, we pass the full list of habits back to the parent.
      onFilterChange(habits);
    } else {
      // Find the specific habit and return it as a single-item array.
      const found = habits.find((h) => h.id === id);
      onFilterChange(found ? [found] : []);
    }
  };

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
    <div className="w-full flex flex-wrap gap-3 p-2 bg-white rounded-xl border shadow-sm mb-2">
      {/* "All" button always appears first */}
      <button
        onClick={() => handleSelect('all')}
        className={`px-4 py-2 rounded-full font-bold transition-all active:scale-95 ${
          selectedId === 'all'
            ? 'bg-gray-800 text-white shadow-md'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        All
      </button>

      {/* Dynamically generated buttons for each habit */}
      {habits.map((habit) => (
        <button
          key={habit.id}
          onClick={() => handleSelect(habit.id)}
          style={{ backgroundColor: habit.color, color: getContrastingTextColor(habit.color) }}
          className={`px-4 py-2 rounded-full font-bold transition-all active:scale-95 ${
            selectedId === habit.id
              ? 'ring-4 ring-offset-2 ring-gray-400'
              : 'opacity-90 hover:opacity-100'
          }`}
        >
          {habit.name}
        </button>
      ))}
     
    </div>
  );
}
