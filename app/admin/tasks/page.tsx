// app/admin/tasks/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ClipboardList, Plus, Users, UserCheck, AlertTriangle, CheckCircle, HelpCircle, Link as LinkIcon, Mail } from 'lucide-react';

export default function AdminTaskAssignment() {
  const [concepts, setConcepts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States điều khiển popup thêm Concept mới phân rã Phase
  const [showPopup, setShowPopup] = useState(false);
  const [conceptName, setConceptName] = useState('');
  
  // Phân bổ người phụ trách mặc định ban đầu cho từng phase khi tạo mới
  const [phase1Staff, setPhase1Staff] = useState('');
  const [phase2Staff, setPhase2Staff] = useState('');

  // Danh sách các Phase quy trình tĩnh của xưởng Luminal
  const projectPhases = [
    { id: 'p1', name: 'Phase 1: Khảo sát & Thiết kế 3D/Concept Nguyên Bản' },
    { id: 'p2', name: 'Phase 2: In Phôi Resin & Xử lý bề mặt thủ công' },
    { id: 'p3', name: 'Phase 3: Sơn mảng nghệ thuật Decor, QC kiểm định' },
    { id: 'p4', name: 'Phase 4: Đóng gói, Bàn giao vận chuyển & CSKH' }
  ];

  const loadData = async () => {
    setLoading(true);
    // 1. Lấy danh sách nhân sự động từ DB (Bao gồm cả cấp quản lý)
    const { data: empData } = await supabase.from('employees').select('*');
    setEmployees(empData || []);

    // 2. Lấy danh sách các Concept/Dự án đang triển khai
    const { data: cpData } = await supabase.from('production_tasks').select('*').order('id', { ascending: false });
    setConcepts(cpData || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateConceptTask = async () => {
    if (!conceptName.trim()) return;

    // Đóng gói cấu trúc Phase tiến độ theo thời gian thực để admin bám sát điểm nghẽn (Stuck)
    const initWorkflow = [
      { phase_id: 'p1', name: 'Thiết kế & Tạo mẫu', handler: phase1Staff || 'Chưa gán', status: 'PROCESSING' },
      { phase_id: 'p2', name: 'In máy & Xử lý phôi', handler: phase2Staff || 'Chưa gán', status: 'PENDING' },
      { phase_id: 'p3', name: 'Sơn Decor & Thẩm mỹ QC', handler: 'Chưa gán', status: 'PENDING' },
      { phase_id: 'p4', name: 'Đóng gói & Vận đơn', handler: 'Chưa gán', status: 'PENDING' }
    ];

    await supabase.from('production_tasks').insert([{
      project_name: conceptName.trim(),
      assigned_to: phase1Staff ? employees.find(e => e.qr_token === phase1Staff)?.full_name : 'Chưa xác định',
      status: 'Phase 1: Thiết kế',
      notes: JSON.stringify(initWorkflow) // Lưu ma trận workflow vào trường ghi chú dưới dạng JSON string
    }]);

    setConceptName('');
    setShowPopup(false);
    loadData();
  };

  // Cập nhật quy trình/Trạng thái stuck trực tiếp qua dropdown của admin
  const handleUpdateCurrentStep = async (id: number, nextStep: string) => {
    await supabase.from('production_tasks').update({ status: nextStep }).eq('id', id);
    loadData();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-slate-100 font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-500" />
          <div>
            <h1 className="text-base font-bold">Trung Tâm Gán Việc Sản Xuất & Giám Sát Phase</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Quản trị viên độc quyền phân bổ công việc - Bám sát điểm tắc nghẽn (Stuck)</p>
          </div>
        </div>
        <button onClick={() => setShowPopup(true)} className="bg-blue-600 hover:bg-blue-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition">
          <Plus className="w-4 h-4" /> Thêm Mới Concept
        </button>
      </div>

      {/* DANH SÁCH CÁC MẪU CONCEPT ĐANG SẢN XUẤT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {concepts.map(c => {
          let workflow: any[] = [];
          try { workflow = JSON.parse(c.notes || '[]'); } catch(e) {}

          return (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-black text-slate-200">{c.project_name}</h3>
                  {/* ĐƯỜNG LINK TRUY CẬP NHANH CỦA NHÂN SỰ ĐƯỢC GÁN PHÍA DƯỚI */}
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Phụ trách chính: <strong className="text-slate-300">{c.assigned_to}</strong></span>
                  </div>
                </div>

                {/* DROPDOWN THAY ĐỔI QUY TRÌNH / PHÁT HIỆN STUCK */}
                <select 
                  className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[10px] font-bold text-amber-400 focus:outline-none"
                  value={c.status}
                  onChange={(e) => handleUpdateCurrentStep(c.id, e.target.value)}
                >
                  <option value="Phase 1: Thiết kế">Phase 1: Thiết kế</option>
                  <option value="Phase 2: In Máy">Phase 2: In Máy</option>
                  <option value="Phase 3: Decor QC">Phase 3: Decor QC</option>
                  <option value="Phase 4: Giao Hàng">Phase 4: Giao Hàng</option>
                  <option value="⚠️ ĐANG STUCK / TẮC NGHẼN">⚠️ ĐANG STUCK / TẮC NGHẼN</option>
                </select>
              </div>

              {/* KHU VỰC HIỂN THỊ CHI TIẾT ĐIỂM NGHẼN CỦA TỪNG PHASE ĐỂ ĐỐC THÚC */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 space-y-2 text-[10px]">
                <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Tiến độ phân mảnh các giai đoạn:</p>
                <div className="grid grid-cols-2 gap-2">
                  {workflow.map((w: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <p className="font-bold text-slate-300 truncate">{w.name}</p>
                      <p className="text-slate-500 mt-0.5">Thực hiện: <span className="text-blue-400 font-medium">{w.handler}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* POPUP THÊM MỚI CONCEPT PHÂN BỔ PHASE BAN ĐẦU */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">Khởi tạo Concept & Gán Phase Quy Trình</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Thiết lập luồng di chuyển công việc tự động cho các bộ phận</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold">Tên Concept / Dự Án Sản Xuất Mới:</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Bộ Keycap Neon Cyberpunk v2..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 mt-1.5 focus:outline-none"
                  value={conceptName}
                  onChange={(e) => setConceptName(e.target.value)}
                />
              </div>

              {/* CHỌN NHÂN VIÊN ĐỘNG TỪ DB CHO PHASE 1 */}
              <div>
                <label className="text-slate-400 font-bold">Gán Phase 1 (Thiết kế & Dựng mẫu):</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 mt-1.5 focus:outline-none"
                  value={phase1Staff}
                  onChange={(e) => setPhase1Staff(e.target.value)}
                >
                  <option value="">-- Chọn thợ/Quản lý thiết kế phụ trách --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.qr_token}>{e.full_name} ({e.is_manager ? 'Quản lý' : 'Thợ'} - {e.title})</option>
                  ))}
                </select>
              </div>

              {/* CHỌN NHÂN VIÊN ĐỘNG TỪ DB CHO PHASE 2 */}
              <div>
                <label className="text-slate-400 font-bold">Gán Phase 2 (Vận hành máy in Resin/PLA):</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 mt-1.5 focus:outline-none"
                  value={phase2Staff}
                  onChange={(e) => setPhase2Staff(e.target.value)}
                >
                  <option value="">-- Chọn nhân sự vận hành máy --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.qr_token}>{e.full_name} ({e.is_manager ? 'Quản lý' : 'Thợ'} - {e.title})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowPopup(false)} className="flex-1 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold text-xs p-3 rounded-xl transition">Hủy bỏ</button>
              <button onClick={handleCreateConceptTask} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs p-3 rounded-xl transition uppercase tracking-wider">Phân rã sản xuất</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}