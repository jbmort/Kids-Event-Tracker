"use client";

import React, { useState } from 'react';
import {Habit} from "@/lib/types"
import { getContrastingTextColor } from '@/lib/utils/utils';


interface HabitSelectorProps {
  habits: Habit[];
  selectedDate?: Date | null;
  onSelectHabit: (habit: Habit) => void;
  onOpenCreateModal: () => void;
};


export const HabitSelector: React.FC<HabitSelectorProps> = ({ 
  habits, 
  selectedDate, 
  onSelectHabit, 
  onOpenCreateModal 
}) => {
  const [activeEdit, setActiveEdit] = useState<boolean>(false);
  const isDateSelected = !!selectedDate;

  return (
    <div className="flex flex-col mx-auto h-full w-full bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Sticky Header */}
      <div className="sticky flex flex-row justify-between align-top top-0 p-4 bg-white border-b border-gray-100 z-10 rounded-xl">
        <div>

        <h2 className="text-2xl font-bold text-gray-900">
          {isDateSelected ? 'Log' : "Select a Date"}
        </h2>
        {!isDateSelected && (
          <p className="text-sm text-red-500 font-medium mt-1 italic">
            Please tap a date on the calendar first
          </p>
        )}
        {activeEdit &&
        <div>
          <button
            onClick={onOpenCreateModal}
            className="w-fit max-w-fit h-10 px-2 m-2 mt-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 font-bold text-lg hover:bg-blue-100 transition-colors"
          >
            + Add New
          </button>
        </div>
        }
        </div>

        {/* "Add New" Action - Always visible to allow adding habits anytime */}
        <button
          onClick={() => setActiveEdit(!activeEdit)}
          className="w-fit max-w-fit h-10 px-2 rounded-xl border-2 border-blue-300 bg-blue-50 text-blue-600 font-bold text-lg hover:bg-blue-100 transition-colors"
        >
          {!activeEdit ? 'Edit' : 'Cancel'}
        </button>
        </div>
        
   

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh] bg-gray-50/50 rounded-xl">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => isDateSelected && onSelectHabit(habit)}
            className={`
              w-fit h-16 flex items-center px-6 rounded-xl border-2 transition-all duration-200 active:scale-95
            `}
            style={{ 
                backgroundColor: habit.color,
                borderColor: habit.color,
                color: getContrastingTextColor(habit.color),
              }}
          >            
            <span className="text-lg font-bold">{habit.name}</span>
          </button>
        ))}
       
      </div>
    </div>
  );
};