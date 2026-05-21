// app/staff/portal/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
// ĐÃ KHẮC PHỤC LỖI: Import chính xác icon RefreshCcw từ thư viện lucide-react
import { 
  User, ClipboardList, Clock, Banknote, Power, CheckCircle2, 
  Circle, Save, Plus, Search, Image as ImageIcon, Briefcase, RefreshCcw 
} from 'lucide-react';

function StaffPortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance'); // Mở link phát hiển thị ngay giao diện chấm công theo ngày

  const [projects, setProjects] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [viewDetailId, setViewDetailId] = useState<number | null>(null);

  // States Tab Chi Phí Vật Tư Của Riêng Nhân Viên
  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expBillUrl, setExpBillUrl] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [currentExpensePage, setCurrentExpensePage] = useState(1);
  const itemsPerExpensePage = 5;

  // States Tab Cá Nhân Bản Thân
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBankName, setProfileBankName] = useState('');
  const [profileBankAcc, setProfileBankAcc] = useState('');

  // States Ca Kíp Chấm Công
  const [isInShift, setIsInShift] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const { data: emp } = await supabase.from('employees').select('*').eq('qr_token', token).maybeSingle();
      if (!emp) return;
      setWorker(emp);
      setProfilePhone(emp.phone || ''); setProfileBankName(emp.bank_name || ''); setProfileBankAcc(emp.bank_account_number || '');

      const todayStr = new Date().toLocaleDateString('en-CA');
      const { data: checkShift } = await supabase.from('attendance').select('*').eq('employee_id', emp.id).eq('work_date', todayStr).maybeSingle();
      if (checkShift && checkShift.check_in && !checkShift.check_out) {
        setIsInShift(true);
      } else {
        setIsInShift(false);
      }

      const { data: projs } = await supabase.from('projects').select('*, phases(*, tasks(*))').order('id', { ascending: false });
      if (projs) {
        // Hiển thị dự án mà thợ có mặt trong ít nhất 1 Task
        const myProjs = projs.filter(p => p.phases.some((ph: any) => ph.tasks.some((t: any) => t.assignee === emp.full_name)));
        myProjs.forEach(p => p.phases.sort((a: any, b: any) => a.order_index - b.order_index));
        setProjects(myProjs);
        if (myProjs.length > 0 && !viewDetailId) setViewDetailId(myProjs[0].id);
      }

      // Chỉ hiển thị phiếu mua hàng của riêng thợ đó
      const { data: exps } = await supabase.from('financial_ledger').select('*').eq('requested_by', emp.full_name).order('id', { ascending: false });
      setExpenses(exps || []);

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [token]);

  // Ghi dữ liệu chấm ca trực tiếp xuống Cloud Database
  const handleToggleShift = async () => {
    if (!worker) return;
    const todayStr = new Date().toLocaleDateString('en-CA');
    const timeNowStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const nextState = !isInShift;

    try {
      if (nextState) {
        const { error } = await supabase.from('attendance').insert([{
          employee_id: worker.id, employee_name: worker.full_name, work_date: todayStr, check_in: timeNowStr, status: 'PRESENT'
        }]);
        if (error) throw error;
        setIsInShift(true);
        alert(`🟢 CHECK-IN THÀNH CÔNG lúc ${timeNowStr}!`);
      } else {
        const { error } = await supabase.from('attendance').update({ check_out: timeNowStr }).eq('employee_id', worker.id).eq('work_date', todayStr);
        if (error) throw error;
        setIsInShift(false);
        alert(`🔴 CHECK-OUT THÀNH CÔNG lúc ${timeNowStr}!`);
      }
      loadData();
    } catch (err: any) {
      alert(`Lỗi chấm công: ${err.message}`);
    }
  };

  const handleUpdateTask = async (taskId: number, field: string, val: string) => {
    await supabase.from('tasks').update({ [field]: val }).eq('id', taskId);
    setProjects(prev => prev.map(p => ({
      ...p, phases: p.phases.map((ph: any) => ({
        ...ph, tasks: ph.tasks.map((t: any) => t.id === taskId ? { ...t, [field]: val } : t)
      }))
    })));
  };

  const submitExpense = async () => {
    if (!expCategory.trim() || !expAmount) return alert('Vui lòng nhập đủ thông tin!');
    const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`.split('-').reverse().join('/');

    await supabase.from('financial_ledger').insert([{
      type: 'CHI_TIEU', category: expCategory.trim(), amount: Number(expAmount), bill_url: expBillUrl.trim(),
      requested_by: worker.full_name, is_paid: false, month_period: currentPeriod
    }]);

    setExpCategory(''); setExpAmount(''); setExpBillUrl('');
    loadData(); alert('✨ Đã nộp phiếu mua vật tư thành công!');
  };

  const updateProfile = async () => {
    await supabase.from('employees').update({ phone: profilePhone.trim(), bank_name: profileBankName.trim(), bank_account_number: profileBankAcc.trim() }).eq('id', worker.id);
    alert('✨ Hồ sơ cá nhân của bạn đã được cập nhật thành công!');
  };

  const getPhaseStatus = (phase: any, allPhases: any[]) => {
    const isAllTasksDone = phase.tasks && phase.tasks.length > 0 && phase.tasks.every((t: any) => t.status === 'DONE');
    if (isAllTasksDone) return 'COMPLETED';
    const firstUnfinished = allPhases.find(p => !p.tasks || p.tasks.length === 0 || p.tasks.some((t: any) => t.status !== 'DONE'));
    if (phase.id === firstUnfinished?.id) return 'ACTIVE';
    return 'PENDING';
  };

  const filteredExpenses = expenses.filter(e => (e.category || '').toLowerCase().includes(expenseSearch.toLowerCase()));
  const totalExpensePages = Math.ceil(filteredExpenses.length / itemsPerExpensePage) || 1;
  const currentExpenseData = filteredExpenses.slice((currentExpensePage - 1) * itemsPerExpensePage, currentExpensePage * itemsPerExpensePage);

  if (loading) return <div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-500 text-xs font-mono"><RefreshCcw className="w-4 h-4 animate-spin mr-2"/> Đang tải cổng Staff Portal...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-5 text-slate-100 bg-slate-950 min-h-screen pb-24 font-sans">
      
      {/* THẺ TÊN ĐỊNH DANH */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl"><User className="w-4 h-4" /></div>
          <div>
            <h2 className="text-xs font-black text-slate-100">{worker.full_name}</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{worker.title} • Cấp độ {worker.level}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider border uppercase ${isInShift ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
          {isInShift ? '⚡ Trong Ca' : '💤 Ngoài Ca'}
        </span>
      </div>

      {/* ⏱️ TAB 1: CA LÀM VIỆC 1 NÚT DUY NHẤT */}
      {activeTab === 'attendance' && (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl max-w-md mx-auto mt-6">
          <div className="text-center space-y-1 select-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> Cổng Chấm Công</span>
            <h2 className="text-2xl font-black font-mono text-slate-100">{liveTime.toLocaleTimeString('vi-VN')}</h2>
            <p className="text-[10px] text-slate-400 font-mono">{liveTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          </div>

          <button 
            onClick={handleToggleShift}
            className={`w-40 h-40 rounded-full border-4 font-black text-xs tracking-wider uppercase transition-all duration-300 transform hover:scale-105 shadow-2xl flex flex-col items-center justify-center gap-2 active:scale-95 cursor-pointer ${
              isInShift ? 'bg-red-950/40 border-red-500 text-red-400 shadow-red-950/50' : 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-emerald-950/50'
            }`}
          >
            <Power className="w-8 h-8" />
            <span>{isInShift ? 'RỜI CA VỀ' : 'VÀO CA LÀM'}</span>
          </button>
        </div>
      )}

      {/* 📦 TAB 2: NHẬN VIỆC (GIỐNG ADMIN, CHỈ ĐƯỢC CHỈNH TASK CỦA BẢN THÂN) */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 font-bold uppercase text-[10px] text-slate-400">Dự án tham gia</div>
            <div className="divide-y divide-slate-800/60 max-h-[350px] overflow-y-auto">
              {projects.length === 0 ? <p className="p-6 text-center text-slate-500 font-mono text-xs italic">Chưa có dự án nào.</p> : projects.map(p => (
                <div key={p.id} onClick={() => setViewDetailId(p.id)} className={`p-4 cursor-pointer transition text-[11px] ${viewDetailId === p.id ? 'bg-blue-950/20 border-l-4 border-blue-500 font-bold' : 'hover:bg-slate-950/20'}`}>
                  <p className="text-slate-200 font-bold text-xs">{p.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl min-h-[50vh]">
            {!viewDetailId ? <div className="text-slate-500 text-xs italic text-center py-12 font-mono">Chọn dự án xem việc.</div> : (
              <div className="space-y-4">
                <h2 className="text-sm font-black text-blue-400 uppercase border-b border-slate-800 pb-3">{projects.find(p => p.id === viewDetailId)?.name}</h2>
                <div className="space-y-3">
                  {projects.find(p => p.id === viewDetailId)?.phases.map((phase: any, index: number, allPhases: any[]) => {
                    const status = getPhaseStatus(phase, allPhases);
                    return (
                      <details key={phase.id} className="group bg-slate-950 border border-slate-800 rounded-xl overflow-hidden" open={status === 'ACTIVE'}>
                        <summary className={`px-4 py-3 cursor-pointer flex justify-between items-center text-xs font-bold transition select-none ${status === 'COMPLETED' ? 'bg-emerald-950/20 text-emerald-400' : status === 'ACTIVE' ? 'bg-blue-950/20 text-blue-400 border-b border-slate-800' : 'text-slate-500 opacity-60'}`}>
                          <div className="flex items-center gap-2">{status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />} Giai đoạn {index + 1}: {phase.name}</div>
                        </summary>
                        <div className="p-4 bg-slate-950 space-y-3">
                          {phase.tasks && phase.tasks.map((task: any) => {
                            const isMyTask = task.assignee === worker.full_name;
                            return (
                              <div key={task.id} className={`p-3 rounded-xl border flex flex-col space-y-3 text-[11px] ${isMyTask ? 'bg-slate-900 border-blue-500/30' : 'bg-slate-950/40 border-slate-850 opacity-40'}`}>
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <p className="font-bold text-slate-200">{task.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Phụ trách: {task.assignee || 'Chưa gán'}</p>
                                  </div>
                                  
                                  <select disabled={!isMyTask} className={`p-1.5 border rounded-lg text-[10px] font-black focus:outline-none w-28 bg-slate-950 ${isMyTask ? 'cursor-pointer border-slate-700' : 'border-transparent text-slate-600'}`} value={task.status} onChange={(e) => handleUpdateTask(task.id, 'status', e.target.value)}>
                                    <option value="TODO">⏳ CHỜ LÀM</option><option value="DOING">⚡ ĐANG LÀM</option><option value="DONE">✓ ĐÃ XONG</option>
                                  </select>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[9px] text-slate-500 font-bold block mb-1 font-mono">ESTIMATE TIMELINE:</label>
                                    <input disabled={!isMyTask} type="text" placeholder="Ví dụ: 3 giờ" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg font-mono text-[10px] text-amber-400 focus:outline-none" value={task.deadline || ''} onChange={(e) => handleUpdateTask(task.id, 'deadline', e.target.value)} />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-[9px] text-slate-500 font-bold block mb-1 font-mono">CHÚ THÍCH / LINK DRIVE KẾT QUẢ:</label>
                                    <input disabled={!isMyTask} type="text" placeholder="Dán link drive hoặc bình luận..." className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-[10px] text-slate-300 focus:outline-none" value={task.note || ''} onChange={(e) => handleUpdateTask(task.id, 'note', e.target.value)} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 💰 TAB 3: BÁO CHI TIÊU VÀ SỔ ĐỐI SOÁT PHÂN TRANG */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs shadow-xl">
            <span className="text-[10px] font-black uppercase text-slate-400 block border-b border-slate-800 pb-2">Tạo phiếu mua vật tư</span>
            <div><label className="text-slate-400">Tên vật tư/Mục đích:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none" value={expCategory} onChange={(e) => setExpCategory(e.target.value)} /></div>
            <div><label className="text-slate-400">Giá tiền thực chi (VND):</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 font-mono text-amber-400 font-bold" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} /></div>
            <div><label className="text-slate-400">Link ảnh hóa đơn (Drive/Zalo):</label><input type="text" placeholder="Dán đường dẫn ảnh bill..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none text-blue-400" value={expBillUrl} onChange={(e) => setExpBillUrl(e.target.value)} /></div>
            <button onClick={submitExpense} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl transition flex justify-center gap-1.5"><Save className="w-4 h-4" /> Nộp Phiếu Hoàn Ứng</button>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sổ đối soát cá nhân của tôi</span>
              <input type="text" placeholder="Lọc chi tiêu..." className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-[10px] w-36 text-slate-200 focus:outline-none" value={expenseSearch} onChange={(e) => { setExpenseSearch(e.target.value); setCurrentExpensePage(1); }} />
            </div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[9px]">
                <tr><th className="p-3">Khoản mục kê khai vật tư</th><th className="p-3">Số tiền</th><th className="p-3 text-center">Trạng thái</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px] font-medium">
                {currentExpenseData.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-mono italic">Chưa phát sinh phiếu vật tư nào.</td></tr> : currentExpenseData.map(e => (
                  <tr key={e.id} className="hover:bg-slate-950/10 transition">
                    <td className="p-3">
                      <p className="font-bold text-slate-200">❌ {e.category}</p>
                      {e.bill_url && <a href={e.bill_url} target="_blank" className="text-blue-400 flex items-center gap-1 mt-1 text-[9px] hover:underline bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/30 w-fit font-mono"><ImageIcon className="w-3 h-3"/> MỞ XEM ẢNH chụp BILL</a>}
                    </td>
                    <td className="p-3 font-mono font-bold text-red-400">{Number(e.amount).toLocaleString()} đ</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] border block w-fit mx-auto ${e.is_paid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>{e.is_paid ? 'ĐÃ TRẢ' : 'TREO NỢ'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalExpensePages > 1 && (
              <div className="p-2 bg-slate-950/30 border-t border-slate-800 flex justify-end gap-1">
                <button disabled={currentExpensePage === 1} onClick={() => setCurrentExpensePage(p => p - 1)} className="p-1 bg-slate-900 border rounded disabled:opacity-25 text-slate-400"><ChevronLeft className="w-3.5 h-3.5"/></button>
                <button disabled={currentExpensePage === totalExpensePages} onClick={() => setCurrentExpensePage(p => p + 1)} className="p-1 bg-slate-900 border rounded disabled:opacity-25 text-slate-400"><ChevronRight className="w-3.5 h-3.5"/></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 👤 TAB 4: CÁ NHÂN & LINK XEM HỢP ĐỒNG */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl max-w-2xl mx-auto space-y-5 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3"><Briefcase className="w-4 h-4 text-blue-400" /><h2 className="font-bold text-slate-200 uppercase text-[12px] tracking-wider">Hồ Sơ Thành Viên Số Hóa</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-slate-500 block mb-1">Số điện thoại:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl focus:outline-none text-slate-200" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} /></div>
            <div><label className="text-slate-500 block mb-1">Tên Ngân hàng thụ hưởng:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl focus:outline-none text-slate-200" value={profileBankName} onChange={e => setProfileBankName(e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="text-slate-500 block mb-1">Số tài khoản nhận lương/hoàn ứng:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl focus:outline-none text-amber-400 font-bold font-mono" value={profileBankAcc} onChange={e => setProfileBankAcc(e.target.value)} /></div>
          </div>
          <button onClick={updateProfile} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black p-3 rounded-xl transition shadow-lg">Lưu cấu hình thông tin</button>
          
          <div className="pt-4 border-t border-slate-800 mt-3">
            <label className="text-slate-500 block mb-2 font-bold uppercase text-[9px] tracking-wider font-mono">Bản sao hợp đồng lao động scan số hóa từ Admin:</label>
            {worker.drive_contract ? (
              <a href={worker.drive_contract} target="_blank" className="block w-full bg-slate-950 border border-slate-700 hover:border-blue-500 text-blue-400 font-bold p-3 rounded-xl text-center transition hover:bg-slate-900 font-mono">📥 MỞ XEM BẢN SCAN PDF HỢP ĐỒNG LAO ĐỘNG</a>
            ) : (
              <div className="w-full bg-slate-950/40 border border-slate-800 border-dashed p-3 rounded-xl text-slate-600 text-center italic font-mono">Hệ thống chưa nạp bản scan hợp đồng lao động của sếp.</div>
            )}
          </div>
        </div>
      )}

      {/* 💥 BOTTOM NAV BAR: 4 CỤM MENU TÁC VỤ CỦA TÔI ĐỒNG BỘ CHÂN TRANG */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2.5 z-40 shadow-2xl flex justify-around items-center text-center select-none text-[10px] font-bold">
        <button onClick={() => setActiveTab('attendance')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'attendance' ? 'text-blue-400 scale-105 font-black' : 'text-slate-500 hover:text-slate-300'}`}><Clock className="w-4 h-4" /><span>Ca Làm Việc</span></button>
        <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'tasks' ? 'text-blue-400 scale-105 font-black' : 'text-slate-500 hover:text-slate-300'}`}><ClipboardList className="w-4 h-4" /><span>Nhận Việc</span></button>
        <button onClick={() => setActiveTab('expenses')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'expenses' ? 'text-blue-400 scale-105 font-black' : 'text-slate-500 hover:text-slate-300'}`}><Banknote className="w-4 h-4" /><span>Báo Chi Tiêu</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-blue-400 scale-105 font-black' : 'text-slate-500 hover:text-slate-300'}`}><User className="w-4 h-4" /><span>Cá Nhân</span></button>
      </div>

    </div>
  );
}

export default function WorkerPortal() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-500 text-xs font-mono">Đang tải cấu hình...</div>}>
      <StaffPortalContent />
    </Suspense>
  );
}