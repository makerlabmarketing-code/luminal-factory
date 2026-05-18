'use client';
import { useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2, Layers } from 'lucide-react';

export default function JobTemplatesPage() {
  const [tasks, setTasks] = useState([
    {
      id: '1',
      task_name: 'In 3D phôi Resin (Máy Elegoo)',
      order_index: 1,
      is_require_image: true,
    },
    {
      id: '2',
      task_name: 'Chà nhám & Vệ sinh cồn siêu âm',
      order_index: 2,
      is_require_image: false,
    },
    {
      id: '3',
      task_name: 'Sơn lên màu lót Concept',
      order_index: 3,
      is_require_image: true,
    },
  ]);
  const [newTaskName, setNewTaskName] = useState('');

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    setTasks([
      ...tasks,
      {
        id: Date.now().toString(),
        task_name: newTaskName,
        order_index: tasks.length + 1,
        is_require_image: false,
      },
    ]);
    setNewTaskName('');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 flex justify-center">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-4">
          <Layers className="w-5 h-5 text-blue-500" />
          <h1 className="text-base font-bold">Cấu Hình Quy Trình Sản Xuất</h1>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Tên công đoạn mới..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
          />
          <button
            onClick={handleAddTask}
            className="bg-blue-600 px-4 rounded-xl text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm"
            >
              <span>
                {task.order_index}. {task.task_name}
              </span>
              <button className="text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
