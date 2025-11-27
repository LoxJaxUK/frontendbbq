import React, { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { apiLogin, seedData } from '../services/api';
import { AlertCircle, ChefHat, User, ShieldCheck, Briefcase } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiLogin(email, password);
      login(data.user, data.token);
      if (data.user.role === 'admin' || data.user.role === 'manager') navigate('/dashboard');
      else navigate('/checklist');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
     setLoading(true);
     try {
        await seedData();
        alert("Dữ liệu mẫu (4 vai trò) đã được tạo thành công!");
     } catch(e: any) { setError(e.message); } 
     finally { setLoading(false); }
  }

  const quickLogin = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-brand-600 mb-2">PHOBBQ</h1>
          <p className="text-gray-500">Hệ thống quản lý công việc</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 mb-6 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg shadow-lg"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
           <p className="text-xs text-center text-gray-400 mb-4">Chọn vai trò Demo</p>
           <div className="grid grid-cols-4 gap-2">
              <button onClick={() => quickLogin('admin@phobbq.com', '123456')} className="p-2 text-[10px] border rounded hover:bg-gray-50 flex flex-col items-center gap-1 group">
                 <ShieldCheck size={16} className="text-gray-400 group-hover:text-brand-600"/>
                 <span>Admin</span>
              </button>
              <button onClick={() => quickLogin('manager@phobbq.com', '123456')} className="p-2 text-[10px] border rounded hover:bg-gray-50 flex flex-col items-center gap-1 group">
                 <Briefcase size={16} className="text-gray-400 group-hover:text-brand-600"/>
                 <span>Quản Lý</span>
              </button>
              <button onClick={() => quickLogin('kitchen@phobbq.com', '123456')} className="p-2 text-[10px] border rounded hover:bg-gray-50 flex flex-col items-center gap-1 group">
                 <ChefHat size={16} className="text-gray-400 group-hover:text-brand-600"/>
                 <span>Bếp</span>
              </button>
              <button onClick={() => quickLogin('service@phobbq.com', '123456')} className="p-2 text-[10px] border rounded hover:bg-gray-50 flex flex-col items-center gap-1 group">
                 <User size={16} className="text-gray-400 group-hover:text-brand-600"/>
                 <span>Phục Vụ</span>
              </button>
           </div>
           
           <div className="mt-6 text-center">
             <button onClick={handleSeed} className="text-xs text-brand-600 hover:underline">
                Reset / Tạo Database Mẫu
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Login;