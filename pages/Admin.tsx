import React, { useState } from 'react';
import { importTasks } from '../services/api';
import { FileSpreadsheet, Upload, CheckCircle } from 'lucide-react';

const AdminPage = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState('');

  const handleImport = async () => {
      try {
          const tasks = JSON.parse(jsonInput);
          if (!Array.isArray(tasks)) throw new Error("Phải là mảng JSON");
          await importTasks(tasks);
          setStatus('Nhập dữ liệu thành công!');
          setJsonInput('');
      } catch (e: any) {
          setStatus('Lỗi: ' + e.message);
      }
  };

  const sampleJson = `[
  { "title": "Công việc mẫu 1", "role": "kitchen", "deadline": "10:00", "description": "Mô tả..." },
  { "title": "Công việc mẫu 2", "role": "service", "deadline": "14:00" }
]`;

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản Trị Hệ Thống</h2>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg text-green-700">
                    <FileSpreadsheet size={24}/>
                </div>
                <div>
                    <h3 className="font-bold text-lg">Nhập Checklist Từ Excel/JSON</h3>
                    <p className="text-sm text-gray-500">Dán dữ liệu JSON hoặc CSV (được convert sang JSON) vào bên dưới</p>
                </div>
            </div>

            <textarea 
                className="w-full h-48 border rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder={sampleJson}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
            />

            <div className="mt-4 flex justify-between items-center">
                <button 
                   onClick={handleImport}
                   disabled={!jsonInput}
                   className="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
                >
                    <Upload size={18}/> Nhập Dữ Liệu
                </button>
                {status && (
                    <span className={`text-sm font-medium ${status.includes('Lỗi') ? 'text-red-600' : 'text-green-600'}`}>
                        {status}
                    </span>
                )}
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-lg mb-4">Danh sách tài khoản (Read-only Demo)</h3>
             <div className="text-sm text-gray-600 space-y-2">
                 <p>• Admin: admin@phobbq.com</p>
                 <p>• Manager: manager@phobbq.com</p>
                 <p>• Bếp: kitchen@phobbq.com</p>
                 <p>• Phục Vụ: service@phobbq.com</p>
             </div>
        </div>
    </div>
  );
};

export default AdminPage;