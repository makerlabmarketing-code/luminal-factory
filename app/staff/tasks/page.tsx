// app/staff/tasks/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { Layers, RefreshCcw, Link as LinkIcon, MessageSquare, Calendar, Clock, Save, Eye, ChevronLeft, ChevronRight, ListTodo, Activity, CheckSquare } from 'lucide-react';

export default function StaffSplitScreenTasksPage() {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [tasks, setTasks] = useState<any[]>([]);
  const [workerName, setWorkerName] = useState('');
  const [loading, setLoading] = useState(true);

  // Phân trang dự án cho thợ bên bảng trái
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Quản lý dự án đang được thợ chọn xem chi tiết bên phải
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);

  // Bộ lưu đệm dữ liệu input local để tránh lag khi gõ
  const [localDriveInputs, setLocalDriveInputs] = useState<{ [key: string]: string }>({});
  const [editableTasks, setEditableTasks] = useState<{ [key: string]: any }>({});

  const loadTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data: emp } = await supabase.from('employees').select('full_name').eq('qr_token', token).maybeSingle();
      if (emp) {
        setWorkerName(emp.full_name);
        const { data: workflow } = await supabase.from('system_settings').select('*').eq('group_name', 'PRODUCTION_WORKFLOW');
        
        // Lọc các bản ghi thợ này được giao việc con
        const filtered = (workflow || []).filter(item => (item.description || '').includes(emp.full_name));
        setTasks(filtered);

        const driveMap: { [key: string]: string } = {};
        const editMap: { [key: string]: any } = {};

        filtered.forEach(item => {
          let currentJSON: any = { project_drive_link: '', project_deadline: '', tasks_list: [] };
          try { currentJSON = JSON.parse(item.description || '{}'); } catch {}

          driveMap[item.key] = currentJSON.project_drive_link || '';

          currentJSON.tasks_list.forEach((t: any, idx: number) => {
            if (t.assignee === emp.full_name) {
              editMap[`${item.key}_TASK_${idx}`] = {
                status: t.status || 'TODO',
                deadline: t.deadline || '',
                note: t.note || ''
              };
            }
          });
        });

        setLocalDriveInputs(driveMap);
        setEditableTasks(editMap);

        // Tự động chọn dự án đầu tiên làm mặc định hiển thị bên màn hình phải nếu thợ chưa bấm chọn
        if (filtered.length > 0 && !selectedProjectName) {
          const firstProjectName = filtered[0].config_name.split(' - ')[0];
          setSelectedProjectName(firstProjectName);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadTasks(); }, [token]);

  const handleBufferChange = (itemKey: string, taskIdx: number, field: string, value: string) => {
    const targetKey = `${itemKey}_TASK_${taskIdx}`;
    setEditableTasks(prev => ({
      ...prev,
      [targetKey]: { ...prev[targetKey], [field]: value }
    }));
  };

  // Phát lệnh lưu việc con lên Supabase
  const handleSaveSpecificTask = async (item: any, taskIdx: number) => {
    try {
      let currentJSON: any = { project_drive_link: '', project_deadline: '', tasks_list: [] };
      try { currentJSON = JSON.parse(item.description || '{}'); } catch {}

      const targetKey = `${item.key}_TASK_${taskIdx}`;
      const bufferedData = editableTasks[targetKey];
      if (!bufferedData) return;

      currentJSON.tasks_list[taskIdx].status = bufferedData.status;
      currentJSON.tasks_list[taskIdx].deadline = bufferedData.deadline;
      currentJSON.tasks_list[taskIdx].note = bufferedData.note;

      const { error } = await supabase.from('system_settings').update({ description: JSON.stringify(currentJSON) }).eq('key', item.key);
      if (error) throw error;
      
      showToast('Đồng bộ thành công', '✓ Đã cập nhật trạng thái phôi lên máy Admin sếp!', 'success');
      loadTasks();
    } catch (e: any) { 
      showToast('Thất bại', e.message, 'error'); 
    }
  };

  // Đồng bộ link drive tổng của dự án từ Staff lên Admin
  const handleStaffSaveDriveLink = async (currentProjectItem: any) => {
    try {
      const newLink = (localDriveInputs[currentProjectItem.key] || '').trim();
      const currentProjectPrefix = currentProjectItem.config_name.split(' - ')[0];

      const { data: siblingPhases } = await supabase
        .from('system_settings')
        .select('*')
        .eq('group_name', 'PRODUCTION_WORKFLOW')
        .like('config_name', `${currentProjectPrefix}%`);

      if (!siblingPhases || siblingPhases.length === 0) return;

      const updatePromises = siblingPhases.map(async (phase) => {
        let currentJSON: any = { project_drive_link: '', project_deadline: '', tasks_list: [] };
        try { currentJSON = JSON.parse(phase.description || '{}'); } catch {}
        currentJSON.project_drive_link = newLink;
        return supabase.from('system_settings').update({ description: JSON.stringify(currentJSON) }).eq('key', phase.key);
      });

      await Promise.all(updatePromises);
      showToast('Đã lưu kho', 'Đã ghim link Drive gốc cho toàn xưởng!', 'success');
      loadTasks();
    } catch (err: any) { 
      showToast('Lỗi', 'Không thể lưu link!', 'error'); 
    }
  };

  // 🛡️ MA TRẬN GOM NHÓM DỰ ÁN TRÁNH TRÙNG LẶP TIÊU ĐỀ
  const projectGroupsMap: { [key: string]: any[] } = {};
  tasks.forEach(t => {
    if (!t.config_name) return;
    const pName = t.config_name.split(' - ')[0];
    if (!projectGroupsMap[pName]) projectGroupsMap[pName] = [];
    projectGroupsMap[pName].push(t);
  });

  const uniqueProjectNames = Object.keys(projectGroupsMap);

  // 📊 MỞ LẠI HỘP BOX TÍNH TỔNG QUAN CỦA THỢ ĐỂ ĐƯA LÊN ĐẦU
  let totalMyTasksCount = 0;
  let doneMyTasksCount = 0;
  let pendingMyTasksCount = 0;

  tasks.forEach(item => {
    let currentJSON: any = { tasks_list: [] };
    try { currentJSON = JSON.parse(item.description || '{}'); } catch {}
    currentJSON.tasks_list.forEach((t: any) => {
      if (t.assignee === workerName) {
        totalMyTasksCount++;
        if (t.status === 'DONE') doneMyTasksCount++;
        else pendingMyTasksCount++;
      }
    });
  });

  // Xử lý phân trang cho danh sách tên dự án bên trái
  const totalPages = Math.ceil(uniqueProjectNames.length / itemsPerPage) || 1;
  const paginatedProjectNames = uniqueProjectNames.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="p-12 text-center text-xs font-mono text-slate-500 bg-slate-950 min-h-screen flex items-center justify-center gap-2"><RefreshCcw className="w-4 h-4 animate-spin" />Đang sắp xếp sơ đồ Split-Screen...</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-slate-100 bg-slate-950 min-h-screen font-sans">
      
      {/* 📊 3 BOX TÍNH TỔNG TIẾN ĐỘ CÁ NHÂN ĐƯỢC PHỤC HỒI RỰC RỠ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold tracking-wide select-none">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between shadow-md">
          <div><p className="text-slate-400 text-[10px] uppercase">Tổng việc con gán máy</p><p className="text-xl font-black font-mono text-purple-400 mt-0.5">{totalMyTasksCount} Đầu việc</p></div>
          <div className="p-2.5 rounded-xl bg-purple-950/40 text-purple-400"><ListTodo className="w-4 h-4" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between shadow-md">
          <div><p className="text-slate-400 text-[10px] uppercase">Hạng mục chưa hoàn thành</p><p className="text-xl font-black font-mono text-blue-400 mt-0.5">{pendingMyTasksCount} Ca trực</p></div>
          <div className="p-2.5 rounded-xl bg-blue-950/40 text-blue-400"><Activity className="w-4 h-4" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between shadow-md">
          <div><p className="text-slate-400 text-[10px] uppercase">Hạng mục báo Đã Xong (✓)</p><p className="text-xl font-black font-mono text-emerald-400 mt-0.5">{doneMyTasksCount} Nghiệm thu</p></div>
          <div className="p-2.5 rounded-xl bg-emerald-950/40 text-emerald-400"><CheckSquare className="w-4 h-4" /></div>
        </div>
      </div>

      {/* TÊN THỢ HIỆN TẠI TRỰC BAN */}
      <div className="text-[11px] font-mono text-slate-500 bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-850/60 w-fit select-none">
        Mã định danh luồng ca kíp: <span className="text-slate-300 font-bold">{workerName}</span>
      </div>

      {/* 🛠️ THẾ TRẬN CHIA ĐÔI MÀN HÌNH CHUẨN LAPTOP / TABLET VÀ ĐỔI DỌC TRÊN MOBILE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* 🧩 MÀN HÌNH BÊN TRÁI: BẢNG TỔNG DỰ ÁN CÓ PHÂN TRANG GỌN GÀNG */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
            Danh Mục Dự Án Sản Xuất Lọc Phân Trang
          </div>
          
          <div className="divide-y divide-slate-800/60">
            {paginatedProjectNames.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500 italic">Bạn chưa tham gia dự án nào.</div>
            ) : (
              paginatedProjectNames.map((pName) => {
                const phases = projectGroupsMap[pName].sort((a, b) => a.key.localeCompare(b.key));
                const totalPhases = phases.length;
                const donePhases = phases.filter(ph => ph.value === 'DONE').length;
                const progressPct = Math.round((donePhases / totalPhases) * 100) || 0;
                const isSelected = selectedProjectName === pName;

                return (
                  <div 
                    key={pName} 
                    onClick={() => setSelectedProjectName(pName)}
                    className={`p-4 cursor-pointer transition flex flex-col space-y-2 relative ${
                      isSelected ? 'bg-purple-950/10 border-l-4 border-purple-500' : 'hover:bg-slate-950/20'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-slate-200 tracking-wide">📦 {pName}</p>
                      <button className={`p-1 rounded-md border ${isSelected ? 'border-purple-500/30 text-purple-400 bg-purple-950/20' : 'border-slate-800 text-slate-500'} lg:hidden`}>
                        <Eye className="w-3.5 h-3.5"/>
                      </button>
                    </div>

                    {/* Thanh phần trăm hoàn thành nhỏ tinh tế */}
                    <div className="flex items-center gap-2 w-full max-w-xs select-none">
                      <div className="w-full bg-slate-950 rounded-full h-1 border border-slate-850 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 rounded-full" style={{ width: `${progressPct}%` }}></div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 font-bold">{progressPct}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 🔥 BẢNG PHÂN TRANG CHUẨN QUẢN LÝ HẠN CHẾ TRÀN MÀN HÌNH */}
          <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500 select-none">
            <span>Tổng số {uniqueProjectNames.length} Dự án</span>
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 bg-slate-900 border border-slate-800 rounded-md text-slate-400 disabled:opacity-20 hover:text-white transition"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="px-2 text-slate-300 font-bold">Trang {currentPage}/{totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1 bg-slate-900 border border-slate-800 rounded-md text-slate-400 disabled:opacity-20 hover:text-white transition"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>

        {/* 🧩 MÀN HÌNH BÊN PHẢI: PIPELINE GIAI ĐOẠN CHI TIẾT & ĐỒNG BỘ MÁY THỢ CA VIỆC */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl min-h-[50vh] space-y-4">
          {!selectedProjectName ? (
            <div className="text-center py-20 text-xs font-mono text-slate-500 italic">Sếp vui lòng click chọn dự án ở bảng trái để mở trạm cập nhật chi tiết.</div>
          ) : (
            <div className="space-y-4">
              
              {/* TIÊU ĐỀ DỰ ÁN ĐANG ĐƯỢC CHỌN (CHỈ HIỂN THỊ DUY NHẤT 1 LẦN TẠI ĐÂY) */}
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-400 select-none">Đang mở chỉ huy chi tiết</span>
                <h2 className="text-sm font-black text-purple-400 uppercase tracking-wide mt-1.5">🎯 Dự án: {selectedProjectName}</h2>
              </div>

              {/* CHUỖI CÁC PHASE THUỘC DỰ ÁN ĐANG ĐƯỢC CHỌN */}
              {projectGroupsMap[selectedProjectName]?.sort((a, b) => a.key.localeCompare(b.key)).map((phase, pIdx) => {
                let currentJSON: any = { project_drive_link: '', project_deadline: '', tasks_list: [] };
                try {
                  const parsed = JSON.parse(phase.description || '{}');
                  if (Array.isArray(parsed)) currentJSON.tasks_list = parsed;
                  else currentJSON = parsed;
                } catch {}

                // Lọc lấy các việc con giao đích danh cho thợ máy này trong Phase này
                const myTasksInThisPhase = currentJSON.tasks_list
                  .map((t: any, i: number) => ({ ...t, __globalIdx: i }))
                  .filter((t: any) => t.assignee === workerName);

                // Nếu phase này thợ không được giao việc nào, ẩn khối phase này đi cho gọn màn hình sếp dặn
                if (myTasksInThisPhase.length === 0) return null;

                return (
                  <div key={phase.key} className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-xl space-y-3 shadow-inner">
                    
                    {/* Header Giai đoạn */}
                    <div className="flex justify-between items-center select-none border-b border-slate-900 pb-2">
                      <span className="font-black text-xs text-slate-300">⚡ Bước Phase {pIdx + 1}: {phase.config_name.split(' - ')[1]}</span>
                      <span className={`text-[9px] font-black tracking-widest uppercase border px-1.5 py-0.5 rounded ${
                        phase.value === 'DONE' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/10' : 'border-blue-500/30 text-blue-400 bg-blue-950/10'
                      }`}>
                        {phase.value === 'DONE' ? '✓ ĐÃ XONG' : '⚡ CA ĐANG CHẠY'}
                      </span>
                    </div>

                    {/* Ô NHẬP LINK DRIVE TỔNG DỰ ÁN (HIỂN THỊ TRÊN PHASE ĐẦU TIÊN CỦA DỰ ÁN ĐỂ KHÔNG BỊ LẶP LẠI) */}
                    {pIdx === 0 && (
                      <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl space-y-2">
                        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 select-none">
                          <LinkIcon className="w-3 height-3 text-blue-400" /> Link Drive tổng hợp tài liệu bản vẽ màu sắc dự án:
                        </label>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text"
                            placeholder="Dán link Drive thư mục tổng hợp phôi sản phẩm..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-blue-400 font-mono focus:outline-none focus:border-blue-800"
                            value={localDriveInputs[phase.key] || ''}
                            onChange={(e) => setLocalDriveInputs({ ...localDriveInputs, [phase.key]: e.target.value })}
                          />
                          <button 
                            onClick={() => handleStaffSaveDriveLink(phase)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-0.5 shrink-0 transition"
                          >
                            Ghim
                          </button>
                          {currentJSON.project_drive_link?.trim() && (
                            <a href={currentJSON.project_drive_link} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold text-[10px] bg-emerald-950/30 border border-emerald-900/30 px-2.5 py-1.5 rounded-lg shrink-0 transition">Mở</a>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1 select-none pt-0.5">
                          <Calendar className="w-3 h-3 text-amber-500"/> Ngày hạn hoàn thành tổng: <span className="text-amber-400 font-bold">{phase.param_type || currentJSON.project_deadline || 'Chưa định'}</span>
                        </div>
                      </div>
                    )}

                    {/* LIÊN KẾT DANH SÁCH VIỆC CON BÊN TRONG PHASE */}
                    <div className="space-y-3 pt-1">
                      {myTasksInThisPhase.map((t: any) => {
                        const targetKey = `${phase.key}_TASK_${t.__globalIdx}`;
                        const taskBuffer = editableTasks[targetKey] || { status: 'TODO', deadline: '', note: '' };

                        return (
                          <div key={t.__globalIdx} className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col gap-2.5">
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2 border-b border-slate-950 pb-2">
                              <div className="space-y-1.5 flex-1">
                                <p className="font-bold text-slate-200 text-xs">⚙️ Hạng mục: {t.name}</p>
                                
                                {/* DateTime picker hạn ca con */}
                                <div className="flex items-center gap-1 text-amber-400 font-mono select-none">
                                  <Clock className="w-3.5 h-3.5 text-amber-500"/>
                                  <span className="text-[9px] text-slate-500 font-bold">Hạn ca trực:</span>
                                  <input 
                                    type="datetime-local"
                                    className="bg-transparent text-amber-400 text-[10px] font-bold focus:outline-none cursor-pointer border border-slate-800 p-0.5 rounded"
                                    value={taskBuffer.deadline}
                                    onChange={(e) => handleBufferChange(phase.key, t.__globalIdx, 'deadline', e.target.value)}
                                  />
                                </div>
                              </div>

                              <select 
                                value={taskBuffer.status} 
                                onChange={(e) => handleBufferChange(phase.key, t.__globalIdx, 'status', e.target.value)}
                                className={`text-[10px] border rounded-lg p-2 font-black bg-slate-950 w-full sm:w-auto text-center cursor-pointer ${
                                  taskBuffer.status === 'DONE' ? 'text-emerald-400 border-emerald-800/40' :
                                  taskBuffer.status === 'DOING' ? 'text-blue-400 border-blue-800/40' : 'text-slate-400 border-slate-800'
                                }`}
                              >
                                <option value="TODO">⏳ CHỜ LÀM</option>
                                <option value="DOING">⚡ ĐANG LÀM</option>
                                <option value="DONE">✓ ĐÃ XONG</option>
                              </select>
                            </div>

                            {/* Ô nhập text comment báo cáo tình trạng màu sắc phôi đúc */}
                            <div className="w-full space-y-1">
                              <label className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider select-none flex items-center gap-0.5"><MessageSquare className="w-3 h-3 text-purple-400"/>Báo cáo tiến độ / Comment màu sắc phôi:</label>
                              <input 
                                type="text"
                                placeholder="Nhập comment (Ví dụ: Đã in phôi thô màu đỏ nhám, chờ sếp duyệt...)"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-purple-900/40"
                                value={taskBuffer.note}
                                onChange={(e) => handleBufferChange(phase.key, t.__globalIdx, 'note', e.target.value)}
                              />
                            </div>

                            {/* 🔥 NÚT LƯU THỦ CÔNG ĐỘC LẬP ĂN LUỒNG RECORD CHI TIẾT */}
                            <button
                              type="button"
                              onClick={() => handleSaveSpecificTask(phase, t.__globalIdx)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-[10px] font-black tracking-wider uppercase flex justify-center items-center gap-1 transition shadow-md cursor-pointer mt-1"
                            >
                              <Save className="w-3.5 h-3.5"/> Lưu Cập Nhật Ca Việc
                            </button>
                          </div>
                  );
                })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}