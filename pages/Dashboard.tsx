import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { getStats, getLogs } from '../services/api';
import { Stats, Log } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClipboardList, CheckCircle, AlertTriangle, Download, History } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  
  useEffect(() => {
    const load = async () => {
       const [s, l] = await Promise.all([getStats(), getLogs()]);
       setStats(s);
       setLogs(l);
    };
    load();
  }, []);

  const handleExport = () => {
      // CSV Export logic
      if (!logs.length) return;
      let csv = "Time,User,Task,Action\n";
      logs.forEach(l => csv += `${l.timestamp},${l.userName},"${l.taskTitle}",${l.action}\n`);
      const link = document.createElement("a");
      link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
      link.download = "baocao.csv";
      link.click();
  };

  if (!stats) return <div className="p-10 text-center">Đang tải báo cáo...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800">Hiệu Suất Hoạt Động</h2>
         {user?.role === 'admin' && (
             <button onClick={handleExport} className="flex items-center gap-2 text-sm bg-white border px-3 py-2 rounded-lg shadow-sm">
                 <Download size={16}/> Xuất Báo Cáo
             </button>
         )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="text-gray-500 text-xs uppercase font-bold mb-1">Tổng Việc</div>
             <div className="text-2xl font-bold">{stats.totalTasks}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="text-green-600 text-xs uppercase font-bold mb-1">Hoàn Thành</div>
             <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="text-red-500 text-xs uppercase font-bold mb-1">Trễ Hạn</div>
             <div className="text-2xl font-bold text-red-500">{stats.lateTasks}</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="text-blue-500 text-xs uppercase font-bold mb-1">Tỉ Lệ</div>
             <div className="text-2xl font-bold text-blue-500">{stats.completionRate}%</div>
         </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-6">Top Nhân Viên Xuất Sắc</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byUser} layout="vertical" margin={{left: 0}}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                   <Tooltip />
                   <Bar dataKey="count" fill="#ea580c" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
             </ResponsiveContainer>
          </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700 flex items-center gap-2">
              <History size={18}/> Nhật Ký Gần Đây
          </div>
          <div className="max-h-80 overflow-y-auto">
             <table className="w-full text-sm">
                 <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                     <tr>
                         <th className="px-4 py-3 text-left">Thời gian</th>
                         <th className="px-4 py-3 text-left">Nhân viên</th>
                         <th className="px-4 py-3 text-left">Hành động</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {logs.map(log => (
                         <tr key={log.id} className="hover:bg-gray-50">
                             <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                                 {new Date(log.timestamp).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                             </td>
                             <td className="px-4 py-2 font-medium">{log.userName}</td>
                             <td className="px-4 py-2">
                                 {log.action === 'upload_image' ? (
                                     <span className="text-blue-600 flex items-center gap-1"><CheckCircle size={14}/> Gửi ảnh báo cáo</span>
                                 ) : log.action === 'complete' ? (
                                     <span className="text-green-600">Hoàn thành: {log.taskTitle}</span>
                                 ) : (
                                     <span className="text-gray-500">Hoàn tác: {log.taskTitle}</span>
                                 )}
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;