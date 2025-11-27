import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { getVideos, addVideo, deleteVideo } from '../services/api';
import { TrainingVideo } from '../types';
import { Trash2, Plus, Youtube } from 'lucide-react';

const Training = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => { loadVideos(); }, []);
  
  const loadVideos = async () => setVideos(await getVideos());

  const handleAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUrl || !newTitle) return;
      await addVideo({ title: newTitle, youtubeUrl: newUrl });
      setNewUrl(''); setNewTitle('');
      loadVideos();
  };

  const handleDelete = async (id: string) => {
      if(confirm('Xóa video này?')) {
          await deleteVideo(id);
          loadVideos();
      }
  };

  // Helper to extract ID
  const getEmbedUrl = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
               <Youtube className="text-red-600"/> Quy Trình Chuẩn (SOP)
           </h2>
       </div>

       {/* Admin Add Form */}
       {user?.role === 'admin' && (
           <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl shadow-sm border border-brand-100 flex flex-col md:flex-row gap-3">
               <input 
                 value={newTitle} onChange={e => setNewTitle(e.target.value)} 
                 placeholder="Tên Video (VD: Quy trình rửa tay)" 
                 className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
               />
               <input 
                 value={newUrl} onChange={e => setNewUrl(e.target.value)} 
                 placeholder="Link YouTube" 
                 className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
               />
               <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 flex items-center justify-center gap-2">
                   <Plus size={18}/> Thêm
               </button>
           </form>
       )}

       {/* Video Grid */}
       <div className="grid md:grid-cols-2 gap-6">
           {videos.map(video => {
               const embedSrc = getEmbedUrl(video.youtubeUrl);
               return (
                   <div key={video.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                       <div className="aspect-video bg-black">
                           {embedSrc ? (
                               <iframe 
                                 src={embedSrc} 
                                 title={video.title}
                                 className="w-full h-full" 
                                 allowFullScreen
                               ></iframe>
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-white">Link lỗi</div>
                           )}
                       </div>
                       <div className="p-4 flex justify-between items-start">
                           <h3 className="font-bold text-lg text-gray-800">{video.title}</h3>
                           {user?.role === 'admin' && (
                               <button onClick={() => handleDelete(video.id)} className="text-gray-400 hover:text-red-500">
                                   <Trash2 size={18}/>
                               </button>
                           )}
                       </div>
                   </div>
               )
           })}
       </div>
    </div>
  );
};

export default Training;