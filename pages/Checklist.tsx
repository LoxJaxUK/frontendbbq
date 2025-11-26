import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../App';
import { Task, Department } from '../types';
import { getTasks, toggleTask } from '../services/api';
import { Check, Clock, RefreshCw, Filter, Layers } from 'lucide-react';

const Checklist = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');
  
  // Realtime-ish polling
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const departmentFilter = user?.role === 'manager' ? undefined : user?.department;
      const data = await getTasks(departmentFilter);
      // Sort: Todo first, then by time
      const sorted = data.sort((a, b) => {
        if (a.isCompleted === b.isCompleted) return 0;
        return a.isCompleted ? 1 : -1;
      });
      setTasks(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleToggle = async (task: Task) => {
    // Optimistic Update
    const previousTasks = [...tasks];
    const newState = !task.isCompleted;
    
    setTasks(prev => prev.map(t => 
      t.id === task.id 
        ? { ...t, isCompleted: newState, completedBy: user?.id, completedByName: user?.name, completedAt: newState ? new Date().toISOString() : undefined } 
        : t
    ));

    try {
      await toggleTask(task.id, newState);
      // Fetch background to ensure data consistency
      fetchData(true);
    } catch (error) {
      // Revert on error
      setTasks(previousTasks);
      alert("Lỗi kết nối! Vui lòng thử lại.");
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'todo') return !t.isCompleted;
    if (filter === 'done') return t.isCompleted;
    return true;
  });

  const completionRate = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.isCompleted).length / tasks.length) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Layers size={20} className="text-brand-500"/>
            {user?.department === Department.KITCHEN ? 'Checklist Bếp' : (user?.department === Department.SERVICE ? 'Checklist Sảnh' : 'Việc cần làm')}
          </h2>
          <p className="text-sm text-gray-500">Hoàn thành: {completionRate}%</p>
        </div>
        <div 
          onClick={() => fetchData()} 
          className="p-2 bg-gray-50 rounded-full text-gray-500 active:bg-gray-200 transition-colors cursor-pointer"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 pb-1">
        {(['all', 'todo', 'done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === f 
                ? 'bg-brand-600 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f === 'all' ? 'Tất cả' : (f === 'todo' ? 'Cần làm' : 'Đã xong')}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <RefreshCw className="animate-spin mb-2" />
          <span className="text-sm">Đang tải công việc...</span>
        </div>
      ) : (
        <div className="space-y-3 pb-24">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              <Check className="mx-auto mb-2 h-10 w-10 opacity-20" />
              <p>Không có công việc nào.</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div 
                key={task.id}
                onClick={() => handleToggle(task)}
                className={`group relative bg-white p-4 rounded-xl border-l-4 shadow-sm transition-all cursor-pointer active:scale-[0.98] select-none ${
                  task.isCompleted 
                    ? 'border-brand-300 bg-gray-50/50' 
                    : 'border-brand-600 shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox - 44px min touch target */}
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    task.isCompleted ? 'bg-brand-500 border-brand-500' : 'border-gray-300 group-hover:border-brand-400 bg-white'
                  }`}>
                    {task.isCompleted && <Check size={20} className="text-white" strokeWidth={3} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-lg leading-tight break-words ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className={`text-sm mt-1 ${task.isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                        {task.description}
                      </p>
                    )}
                    
                    {task.isCompleted && task.completedAt && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-brand-600 font-medium bg-brand-50 w-fit px-2 py-1 rounded">
                        <Clock size={12} />
                        <span>{new Date(task.completedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                        {task.completedByName && <span className="text-gray-400 pl-1 border-l border-brand-200"> {task.completedByName}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Checklist;