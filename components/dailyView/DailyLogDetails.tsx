"use client";

import React, { useState } from 'react';
import { Log, Habit } from '@/lib/types';
import { getContrastingTextColor } from '@/lib/utils/utils';
import { attemptBackgroundSync, getLocalCache, getSyncQueue, removeFromLogQueue, setLogCache } from '@/services/localData';
import { deleteLog } from '@/app/actions/logs';

interface DailyLogDetailProps {
  logs: Log[];
  habits: Habit[];
  currentDay: Date;
  setLogs: (logs: Log[]) => void;
}

export default function DailyLogDetails({ logs, habits, currentDay, setLogs }: DailyLogDetailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeEdit, setActiveEdit] = useState<boolean>(false);
  
  const getSafeDate = (ts: string | number | Date): Date => {
    return new Date(ts);
  };


  // Helper to find the habit's color by its ID
  const getHabitColor = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    return habit?.color || '#3b82f6'; // Default blue if not found
  };

  const getValue = (habit: Habit, log : Log) => {
    let value = "";

    if(habit.scaleValues.length > 1 && log.scaleValue){
        const length = habit.scaleValues.length;

        if(length === 2){
            switch (log.scaleValue){
                case 1: value = habit.scaleValues[0];
                case 10: value = habit.scaleValues[1];
            }
        }else if(length === 5){
            switch (log.scaleValue){
                case 1: value = habit.scaleValues[0];
                case 3: value = habit.scaleValues[1];
                case 5: value = habit.scaleValues[2];
                case 7: value = habit.scaleValues[3];
                case 10: value = habit.scaleValues[4];
            }
        }else if(length === 10){
            value = habit.scaleValues[log.scaleValue - 1];
        }
    }
        return value;
  }

   const handleDelete = async (logId: string) => {
    console.log('daily' + logId)
    if (window.confirm("Are you sure you want to delete this entry?")) {
      // If it's in the queue, it means it hasn't hit the server yet. 
      // We can remove it from local storage immediately.
      if (getSyncQueue().find(l => l.id === logId)) {
        removeFromLogQueue(logId);
        setLogs([...logs.filter(l => l.id !== logId)]); 
      } else {
        // If it's not in the queue, it means it's already "known" by the server.
        // We attempt to delete it from the database.
        const result = await deleteLog(logId);
        if (!result.success) {
          alert("Failed to delete. Please try again when you are connected to the server.");
        }
        else{
            const newLogs = logs.filter(l => l.id !== logId);
            const newCache = getLocalCache().filter(l => l.id !== logId);
            setLogCache(newCache);
            setLogs(newLogs); 
        }
      }

      setActiveEdit(false);
      // Always attempt a sync after deletion to clean up any state/queues
      attemptBackgroundSync();
    }
}

  return (
    <div className="flex flex-col mx-auto h-full w-full overflow-clip rounded-xl shadow-lg glass-style">
      {/* Heading for the section */}
      <div className="sticky flex flex-row justify-between align-middle top-0 p-2 glass-style z-10 rounded-t-xl">
        <h2 className="text-xl font-bold pt-2 text-gray-900">Log Details</h2>
        <button
            onClick={() => setActiveEdit(!activeEdit)}
            className="w-fit max-w-fit h-10 px-2 rounded-xl border-2 shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.3)] glass-style text-[#3e22f49a] font-bold text-lg hover:bg-blue-100 transition-colors"
          >
            {activeEdit ? 'Cancel' : 'Edit'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[60vh]">
        {logs.filter(log => {
            const date = getSafeDate(log.timestamp);
            return date.getDay() == currentDay.getDay();
            }).map((log) => {
        const habit = habits.find(h => h.id === log.habitId);
        const color = getHabitColor(log.habitId);

          return (
            <div key={log.id} className=" rounded-xl overflow-hidden shadow-md">
              {/* The "Bar" - Colored based on the habit */}
              <div
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className={`w-full flex justify-between p-2 transition-transform active:scale-[0.98]`}
                style={{ backgroundColor: color, color: getContrastingTextColor(color) }}
                role='button'
              >
                <div className='flex flex-col w-full' >
                <div className='flex flew-row justify-between w-full'>
                    <div className="flex flex-col w-fit py-1.5">
                    <span className="font-bold text-lg ml-3" style={{alignSelf: 'flex-start'}}>{habit?.name || "Unknown Activity"}</span>
                    </div>
                    <div>
                    {activeEdit && (
                        <button
                            onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(log.id);
                            }}
                            className="ml-auto p-2 bg-[#f9f7f794]  rounded-full border-red-500 transition-colors"
                            title="Delete Habit"
                        >
                            🗑️
                        </button>)}
                    {!activeEdit && habit !== undefined && (habit.scaleValues.length > 1 || log.description && log.description?.trim() !== '') &&
                        <span className="text-xl" style={{alignSelf: 'flex-end'}}>{expandedId === log.id ? '−' : '+'}</span>
                    }
                    </div>
                </div>
              {/* Expanded Content */}

              {expandedId === log.id && habit !== undefined && (habit.scaleValues.length > 1 || log.description && log.description?.trim() !== '') && (
                <div className="px-2 pb-2 pt-0 animate-in fade-in slide-in-from-top-1 flex align-start">
                  <div className="p-2">
                    {habit.scaleValues.length > 1 && (
                      <p className="mb-1 text-sm font-semibold">Scale Value: {getValue(habit, log)} </p>
                    )}
                    {log.description && (
                      <p className="text-sm italic">{log.description}</p>
                    )}
                  </div>
                </div>
              )}
              </div>
              
              </div>

              
            </div>
          );
        })}
      </div>
    </div>
  );
}