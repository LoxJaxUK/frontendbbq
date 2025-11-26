import React, { useEffect, useState } from 'react';
import { getStats, getLogs } from '../services/api';
import { Stats, Log } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ClipboardList, CheckCircle, TrendingUp, Download, History } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, logsData] = await Promise.all([getStats(), getLogs()]);
        setStats(statsData);
        setLogs(logsData);
      } catch (error) {
        console.error("Fetch stats error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const handleExportCSV = () => {
    if (!logs.length) return;
    
    // Header
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,User,Task,Action\n";
    
    // Rows
    logs.forEach(log => {
      const row = `${new Date(log.timestamp).toLocaleString()},${log.userName},"${log.taskTitle}",${log.action}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `phobbq_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !stats) {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-pulse text-gray-500">Đang tải dữ liệu...</div>
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">Tổng quan hoạt động</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download size={16} />
          Xuất CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-50 p-2 rounded-full mb-2">
            <ClipboardList className="text-blue-600" size={20} />
          </div>
          <span className="text-2xl font-bold text-gray-800">{stats.totalTasks}</span>
          <span className="text-[10px] md:text-xs text-gray-500">Tổng công việc</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-green-50 p-2 rounded-full mb-2">
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <span className="text-2xl font-bold text-gray-800">{stats.completedTasks}</span>
          <span className="text-[10px] md:text-xs text-gray-500">Đã xong</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-orange-50 p-2 rounded-full mb-2">
            <TrendingUp className="text-orange-600" size={20} />
          </div>
          <span className="text-2xl font-bold text-gray-800">{stats.completionRate}%</span>
          <span className="text-[10px] md:text-xs text-gray-500">Tiến độ</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Chart: Completion by User */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Top Nhân Viên (Việc đã làm)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byUser} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 11}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#ea580c" radius={[0, 4, 4, 0]} barSize={15}>
                  {stats.byUser.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ea580c' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

         {/* Chart: Hourly Activity */}
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Mật độ hoạt động (giờ)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byHour}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-4 border-b border-gray-100 flex items-center gap-2">
             <History size={18} className="text-gray-500"/>
             <h3 className="font-semibold text-gray-700">Nhật ký hoạt động</h3>
         </div>
         <div className="max-h-60 overflow-y-auto">
             <table className="w-full text-sm text-left text-gray-500">
                 <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                     <tr>
                         <th className="px-4 py-3">Thời gian</th>
                         <th className="px-4 py-3">Nhân viên</th>
                         <th className="px-4 py-3">Hành động</th>
                     </tr>
                 </thead>
                 <tbody>
                     {logs.map(log => (
                         <tr key={log.id} className="border-b hover:bg-gray-50">
                             <td className="px-4 py-2 font-medium">{new Date(log.timestamp).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</td>
                             <td className="px-4 py-2">{log.userName}</td>
                             <td className="px-4 py-2">
                                 <span className={log.action === 'complete' ? 'text-green-600' : 'text-red-500'}>
                                     {log.action === 'complete' ? 'Đã xong: ' : 'Hoàn tác: '} 
                                 </span>
                                 <span className="text-gray-800">{log.taskTitle}</span>
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