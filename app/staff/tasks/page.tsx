'use client';
import { useState } from 'react';
import { CheckCircle2, Lock, Camera, LayoutGrid } from 'lucide-react';

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState([
    {
      id: '1',
      name: 'In 3D phôi Resin (Máy Elegoo)',
      order: 1,
      is_require_image: true,
      status: 'DOING',
      img: '',
    },
    {
      id: '2',
      name: 'Chà nhám & Vệ sinh cồn siêu âm',
      order: 2,
      is_require_image: false,
      status: 'LOCK',
      img: '',
    },
  ]);

  const handleCompleteTask = (index: number) => {
    const updated = [...tasks];
    if (updated[index].is_require_image) {
      updated[index].img =
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80';
    }
    updated[index].status = 'COMPLETED';
    if (index + 1 < updated.length) updated[index + 1].status = 'DOING';
    setTasks(updated);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2 mb-4">
          <LayoutGrid className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold">PROJ-RONG-01 | Keycap Artisan</h2>
        </div>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border ${
                task.status === 'COMPLETED'
                  ? 'bg-emerald-950/10 border-emerald-900/40'
                  : task.status === 'DOING'
                  ? 'bg-slate-950 border-blue-500'
                  : 'bg-slate-950/20 border-transparent opacity-20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4
                    className={`text-sm font-semibold ${
                      task.status === 'COMPLETED'
                        ? 'line-through text-slate-500'
                        : ''
                    }`}
                  >
                    {task.name}
                  </h4>
                  {task.status === 'DOING' && (
                    <button
                      onClick={() => handleCompleteTask(index)}
                      className="mt-2 bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" /> Báo cáo kết quả
                    </button>
                  )}
                  {task.img && (
                    <img
                      src={task.img}
                      alt="QC"
                      className="w-14 h-14 object-cover rounded-lg mt-2 border border-slate-800"
                    />
                  )}
                </div>
                {task.status === 'LOCK' && (
                  <Lock className="w-4 h-4 text-slate-600" />
                )}
                {task.status === 'COMPLETED' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
