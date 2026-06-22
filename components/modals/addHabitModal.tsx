'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Habit } from '@/lib/types';

interface Props {
  onSuccess: (habit: Habit, isNewHabit: boolean) => void;
  onClose: () => void;
  habit: Habit | undefined;
}

export default function AddHabitModal({ onSuccess, onClose, habit }: Props) {
  const [name, setName] = useState(habit ? habit.name : '');
  const [color, setColor] = useState(habit ? habit.color :'#3b82f6');
  const [scaleCount, setScaleCount] = useState<number>(habit ? habit.scaleValues.length : 0);
  const [labels, setLabels] = useState<string[]>(habit ? habit.scaleValues : []);

  // Validation states
  const [errors, setErrors] = useState<{ name?: string; scales?: string }>({});

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSave = () => {
    const newErrors: Partial<typeof errors> = {};
    if (!name.trim()) {
      newErrors.name = "Habit name is required";
    }
    
    const hasEmptyScale = scaleCount > 0 && labels.some(l => !l.trim());
    if (scaleCount > 0 && hasEmptyScale) {
      newErrors.scales = "All scale values must be filled";
    }

    setErrors(newErrors);

    // Only proceed if no errors exist
    if (Object.keys(newErrors).length === 0) {
    const newHabit: Habit = {
      id: habit ? habit.id : crypto.randomUUID(),
      name,
      color,
      scaleValues: labels,
      createdAt: habit ? new Date(habit.createdAt) : new Date(),
    };
    const isNewHabit = habit ? false : true;
    onSuccess(newHabit, isNewHabit);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center text-gray-800 bg-black/40 backdrop-blur-sm p-4">
      <div 
        ref={modalRef}
        className=" w-full max-w-md rounded-2xl shadow-2xl p-6 modal-glass"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Habit</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Habit Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((errors)=> ({...errors, name: undefined})); // Clear error as user types
              }}
              placeholder="e.g., Morning Vitamins"
              className={`w-full p-4 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Color</label>
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 cursor-pointer bg-transparent"
              />
              <span className="text-sm text-gray-500">Choose any color from the wheel</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scale Options</label>
            <select 
              value={scaleCount}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setScaleCount(val);
                setLabels(new Array(val).fill(''));
                if (errors.scales) setErrors((errors)=> ({...errors, scales: undefined})); // Clear error when changing scale mode
                    }}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value={0}>No Scale</option>
              <option value={2}>2 Points</option>
              <option value={5}>5 Points</option>
              <option value={10}>10 Points</option>
            </select>
          </div>

          {scaleCount > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Scale Labels</p>
              <div className="grid grid-cols-2 gap-2">
                {labels.map((label, index) => (
                  <input
                    key={index}
                    type="text"
                    placeholder={`Label ${index + 1}`}
                    value={label}
                    onChange={(e) => {
                      const newLabels = [...labels];
                      newLabels[index] = e.target.value;
                      setLabels(newLabels);
                    }}
                    className={`w-full p-2 bg-gray-50 border rounded-lg text-sm ${
                      errors.scales && !label.trim() ? 'border-red-500' : 'border-gray-200'
              }`}
                  />
                ))}
              </div>
              {errors.scales && <p className="text-red-500 text-xs">{errors.scales}</p>}
          </div>
          )}

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                name.trim() && (!errors.name && (!errors.scales || scaleCount === 0))
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Create Habit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

