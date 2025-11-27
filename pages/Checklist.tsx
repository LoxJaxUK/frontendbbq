import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../App';
import { Task } from '../types';
import { getTasks, toggleTask } from '../services/api';
import { Check, Clock, RefreshCw, Filter, Camera, AlertTriangle, Image as ImageIcon } from 'lucide-react';

const Checklist = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done' | 'late'>('pending');
  
  // Image Upload Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Kitchen/Service get their tasks automatically via API logic
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (task: Task) => {
    if (task.status === 'done') {
        if (!confirm("Bạn muốn bỏ đánh dấu hoàn thành?")) return;
        await toggleTask(task.id, false);
    } else {
        // Only allow toggle if no image required or simple tick. 
        // For this requirement, we allow simple tick but showing camera icon for upload.
        await toggleTask(task.id, true);
    }
    fetchData();
  };

  const handleImageClick = (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation();
      setSelectedTaskId(taskId);
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedTaskId) {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              // Optimistic UI could go here
              await toggleTask(selectedTaskId, true, base64);
              fetchData();
              setSelectedTaskId(null);
          };
          reader.readAsDataURL(file);
      }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'done') return t.status === 'done';
    if (filter === 'late') return t.status === 'late';
    if (filter === 'pending') return t.status === 'pending';
    return true;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Hidden Input for Camera */}
      <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
      />

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex overflow-x-auto no-scrollbar gap-2">
         {[
             { id: 'pending', label: 'Cần làm', color: 'bg-blue-100 text-blue-700' },
             { id: 'late', label: 'Trễ hạn', color: 'bg-red-100 text-red-700' },
             { id: 'done', label: 'Đã xong', color: 'bg-green-100 text-green-700' },
             { id: 'all', label: 'Tất cả', color: 'bg-gray-100 text-gray-700' },
         ].map((f: any) => (
             <button 
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === f.id ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-50 text-gray-600'}`}
             >
                {f.label} <span className="ml-1 opacity-75 text-xs">
                    ({tasks.filter(t => f.id === 'all' ? true : t.status === f.id).length})
                </span>
             </button>
         ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
          {loading ? (
             <div className="text-center py-10 text-gray-400">Đang tải...</div>
          ) : filteredTasks.length === 0 ? (
             <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">Không có công việc nào</div>
          ) : (
             filteredTasks.map(task => (
                 <div 
                    key={task.id}
                    className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden transition-all ${task.status === 'done' ? 'opacity-75' : ''}`}
                 >
                     {/* Status Strip */}
                     <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                         task.status === 'done' ? 'bg-green-500' : 
                         task.status === 'late' ? 'bg-red-500' : 'bg-brand-500'
                     }`}></div>

                     <div className="flex gap-3 pl-2">
                         {/* Checkbox */}
                         <button 
                            onClick={() => handleToggle(task)}
                            className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center mt-1 transition-colors ${
                                task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-brand-400'
                            }`}
                         >
                             {task.status === 'done' && <Check size={18} className="text-white" strokeWidth={3} />}
                         </button>

                         <div className="flex-1">
                             <div className="flex justify-between items-start">
                                 <h3 className={`font-semibold text-gray-900 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                                     {task.title}
                                 </h3>
                                 {task.deadline && (
                                     <span className={`text-xs font-bold px-2 py-1 rounded border ${
                                         task.status === 'late' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                                     }`}>
                                         {task.deadline}
                                     </span>
                                 )}
                             </div>
                             
                             <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                             
                             {/* Actions Row */}
                             <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                 <div className="text-xs text-gray-400">
                                     {task.status === 'done' && task.completedAt && (
                                         <span>Xong lúc: {new Date(task.completedAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span>
                                     )}
                                     {task.status === 'late' && (
                                         <span className="flex items-center gap-1 text-red-500 font-medium"><AlertTriangle size={12}/> Quá hạn</span>
                                     )}
                                 </div>
                                 
                                 <div className="flex items-center gap-2">
                                     {task.image && (
                                         <a href={task.image} target="_blank" className="text-blue-500 text-xs underline flex items-center gap-1">
                                             <ImageIcon size={14}/> Xem ảnh
                                         </a>
                                     )}
                                     {/* Camera Button */}
                                     <button 
                                        onClick={(e) => handleImageClick(e, task.id)}
                                        className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                                     >
                                         <Camera size={18} />
                                     </button>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             ))
          )}
      </div>
    </div>
  );
};

export default Checklist;