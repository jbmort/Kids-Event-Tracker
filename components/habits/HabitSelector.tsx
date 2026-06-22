"use client";

import React, { useState } from 'react';
import { Habit } from "@/lib/types";
import { getContrastingTextColor } from '@/lib/utils/utils';
import { deleteHabit } from "@/app/actions/habits"; // Import the server action
import { attemptBackgroundSync, deleteHabitSyncQueue, getHabitCache, getHabitQueue, setHabitCache } from '@/services/localData';

interface HabitSelectorProps {
  habits: Habit[];
  openEditModal: (habit : Habit | undefined) => void;
  setHabits: (habits: Habit[]) => void;
  selectedDate?: Date | null;
  onSelectHabit: (habit: Habit) => void;
  onOpenCreateModal: () => void;
}

export const HabitSelector: React.FC<HabitSelectorProps> = ({ 
  habits, 
  selectedDate, 
  openEditModal,
  onSelectHabit, 
  onOpenCreateModal,
  setHabits
}) => {
  const [activeEdit, setActiveEdit] = useState<boolean>(false);
  const isDateSelected = !!selectedDate;

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete?")) {
      if(getHabitQueue().find((habit) => habit.id === id)){
          deleteHabitSyncQueue(id); 
          setHabits(habits.filter((habit) => habit.id !== id));
      }else{
      const result = await deleteHabit(id);
        if (!result.success) {
          alert("Failed to delete. Please try again when you are connected to the server.");
        }
        if (result.success) {
          const habitCache = getHabitCache().filter((habit) => habit.id !== id);
          setHabitCache(habitCache);
          setHabits([...habitCache, ...getHabitQueue()]);
        }
      }
    } 
    setActiveEdit(false);
    attemptBackgroundSync(); 
  }

  const startEdit = (habit: Habit) => {
    openEditModal(habit);
    setActiveEdit(false);
  }
  

  return (
    <div className="flex flex-col mx-auto h-full w-full overflow-clip rounded-xl glass-style shadow-lg ">
      {/* Sticky Header */}
      <div className="sticky flex flex-col align-top top-0 p-2 glass-style z-10 rounded-t-xl">
        <div className='flex justify-between'>
          <h2 className="text-xl font-bold text-gray-900 p-2">
            {activeEdit ? 'Select to Update' : isDateSelected ? 'Log' : "Select a Date"}
          </h2>
          {!isDateSelected && (
            <p className="text-sm text-red-500 font-medium mt-1 italic">
              Please tap a date on the calendar first
            </p>
          )}
        <button
            onClick={() => setActiveEdit(!activeEdit)}
            className="w-fit max-w-fit h-10 px-2 rounded-xl border-2 shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.3)] border-blue-400  text-[#3e22f49a] font-bold text-lg glass-style transition-colors"
          >
            {activeEdit ? 'Cancel' : 'Edit'}
        </button>

      
      </div>
   
        </div>  
      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh] ">
        {habits.map((habit) => (
          <div
            role='button'
            key={habit.id}
            onClick={() => activeEdit ? startEdit(habit) : isDateSelected && onSelectHabit(habit)}
            className={`
              w-full h-16 flex items-center px-6 rounded-xl shadow-md transition-all duration-200 active:scale-95
            `}
            style={{ 
                backgroundColor: habit.color,
                borderColor: habit.color,
                color: getContrastingTextColor(habit.color),
            }}
          >            
            <span className="text-lg font-bold">{habit.name}</span>
            
            {/* Delete Button - Only visible in Edit Mode */}
            {activeEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(habit.id);
                }}
                className="ml-auto p-2 bg-[#f9f7f795] hover:bg-red-300 rounded-full border-red-500 transition-colors"
                title="Delete Habit"
              >
                🗑️
              </button>
            )}
          </div>
        ))}


      </div>
       {activeEdit && (
            <div className="sticky flex flex-col align-top top-0 p-2  z-10 glass-style">
              <button
                onClick={onOpenCreateModal}
                className="w-fit max-w-fit shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.3)] h-10 p-1 m-1 mt-4 rounded-xl border-2 glass-style  text-blue-600 font-bold text-lg transition-colors"
              >
                + Add New
              </button>
            </div>
          )}
    </div>
  );
};