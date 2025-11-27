import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { getRules, updateRule } from '../services/api';
import { Rule } from '../types';
import { Edit2, Save } from 'lucide-react';

const Rules = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const data = await getRules();
    setRules(data);
    if (data.length > 0) {
        setEditTitle(data[0].title);
        setEditContent(data[0].content);
    }
  };

  const handleSave = async () => {
      await updateRule(editTitle, editContent);
      setIsEditing(false);
      loadRules();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[80vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-brand-600 uppercase">
                {rules.length > 0 ? rules[0].title : "Nội Quy Nhà Hàng"}
            </h2>
            {user?.role === 'admin' && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-brand-600 hover:bg-brand-50 px-3 py-1 rounded-lg">
                    <Edit2 size={16}/> Chỉnh sửa
                </button>
            )}
            {isEditing && (
                <button onClick={handleSave} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
                    <Save size={16}/> Lưu Thay Đổi
                </button>
            )}
        </div>
        
        <div className="p-6">
            {isEditing ? (
                <div className="space-y-4">
                    <input 
                        className="w-full text-xl font-bold border-b p-2 focus:outline-none focus:border-brand-500" 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Tiêu đề nội quy"
                    />
                    <textarea 
                        className="w-full h-[60vh] p-4 border rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Nhập nội dung nội quy..."
                    />
                </div>
            ) : (
                <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                    {rules.length > 0 ? rules[0].content : "Chưa có nội quy nào được cập nhật."}
                    {rules.length > 0 && (
                        <p className="mt-8 text-sm text-gray-400 italic text-right">
                            Cập nhật lần cuối bởi {rules[0].updatedBy} lúc {new Date(rules[0].updatedAt).toLocaleDateString('vi-VN')}
                        </p>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default Rules;