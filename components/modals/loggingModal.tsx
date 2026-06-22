'use client';

import React, { useState } from 'react';
import { Log, Habit } from '@/lib/types';

interface Props {
  onSuccess: (log: Log) => void;
  onClose: () => void;
  habit: Habit;
  userId: string;
  timestamp: Date;
}

export default function LoggingModal({ onSuccess, onClose, habit, userId, timestamp }: Props) {
  const [description, setDescription] = useState('');
  const [sliderIndex, setSliderIndex] = useState(0);
  

  // Helper to map the index back to a numeric value for the database
  const getScaleMapping = (count: number): number[] => {
    if (count === 2) return [1, 10];
    if (count === 5) return [1, 3, 5, 7, 10];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  };

  const scaleMapping = habit.scaleValues.length > 0 ? getScaleMapping(habit.scaleValues.length) : [];

  const handleSave = () => {
    const newLog: Log = {
      id: crypto.randomUUID(),
      timestamp,
      description: description || null,
      // If the habit has scale values (e.g., ["Small", "Large"]), 
      // we save the numeric value from our mapping (e.g., 1 or 10)
      scaleValue: habit.scaleValues.length > 0 ? scaleMapping[sliderIndex] : null,
      userId,
      habitId: habit.id,
    };

    onSuccess(newLog);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center text-gray-800 justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 modal-glass">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Log: {habit.name}</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note about this entry..."
              className="w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24"
            />
          </div>

          {habit.scaleValues.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">What is it like?</label>
              <div className="relative flex flex-col">
                {/* Label Hints Container */}
                <div className="flex justify-between w-full px-2 mb-2">
                  {habit.scaleValues.map((label, idx) => (
                    <span 
                      key={idx} 
                      className={`text-xs font-medium cursor-pointer transition-colors duration-200 ${
                        idx === sliderIndex ? 'text-violet-600 font-bold scale-110' : 'text-gray-400'
                      }`}
                      onClick={() => setSliderIndex(idx)}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {/* Slider Input */}
                <input
                  type="range"
                  min="0"
                  max={habit.scaleValues.length - 1}
                  step="1"
                  value={sliderIndex}
                  onChange={(e) => setSliderIndex(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 mt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 glass-style text-red-500 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-4 glass-style text-violet-600 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}