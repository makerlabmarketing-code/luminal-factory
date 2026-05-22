// app/staff/portal/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { User, ClipboardList, Clock, Banknote, Power, CheckCircle2, Circle, Save, Plus, Search, Image as ImageIcon, Briefcase, RefreshCcw } from 'lucide-react';

function StaffPortalContent() {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [worker, setWorker] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');

  const [projects, setProjects] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [viewDetailId, setViewDetailId] = useState<number | null>(null);

  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expBillUrl, setExpBillUrl] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');

  const [profilePhone, setProfilePhone] = useState('');
  const [profileBankName, setProfileBankName] = useState('');
  const [profileBankAcc, setProfileBankAcc] = useState('');

  const [isInShift, setIsInShift] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const shiftsArray = ['Ca Sáng', 'Ca Chiều', 'Ca Tối'];
  const [selectedShift, setSelectedShift] = useState('Ca Sáng');

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const { data: metaBranch } = await supabase.from('system_metadata').select('data').eq('name', 'Danh sách Chi nhánh').maybeSingle();
      setBranches(metaBranch?.data || [
        { "code": "CN1", "name": "Xưởng chính Luminal Hà Nội", "lat": 20.982252, "lng": 105.886674, "radius": 20 },
        { "code": "CN2", "name": "Văn phòng Điều hành - TP.HCM", "lat": 10.762622, "lng": 106.660172, "radius": 150 }
      ]);

      const { data: emp } = await supabase.from('employees').select('*').eq('qr_token', token).maybeSingle();
      if (!emp) return;
      setWorker(emp);
      setProfilePhone(emp.phone || ''); setProfileBankName(emp.bank_name || ''); setProfileBankAcc(emp.bank_account_number || '');

      const todayStr = new Date().toLocaleDateString('en-CA');
      const { data: checkShift } = await supabase.from('attendance').select('*').eq('employee_id', emp.id).eq('work_date', todayStr).maybeSingle();
      setIsInShift(!!(checkShift && checkShift.check_in && !checkShift.check_out));

      const { data: projs } = await supabase.from('projects').select('*, phases(*, tasks(*))').order('id', { ascending: false });
      if (projs) {
        const myProjs = projs.filter(p => p.phases.some((ph: any) => ph.tasks.some((t: any) => t.assignee === emp.full_name)));
        setProjects(myProjs);
        if (myProjs.length > 0 && !viewDetailId) setViewDetailId(myProjs[0].id);
      }

      const { data: exps } = await supabase.from('financial_ledger').select('*').eq('requested_by', emp.full_name).order('id', { ascending: false });
      setExpenses(exps || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [token]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const handleToggleShiftWithGPS = () => {
    if (!navigator.geolocation) return showToast('Lỗi thiết bị', 'Thiết bị không hỗ trợ định vị GPS!', 'error');

    const assignedBranch = branches.find(b => b.code === (worker?.branch_code || 'CN1')) || branches[0];
    showToast('Đang định vị', `Đang xác thực tọa độ với [${assignedBranch.name}]...`, 'info');

    navigator.geolocation.getCurrentPosition(async (position) => {
      const uLat = position.coords.latitude;
      const uLng = position.coords.longitude;
      const distance = calculateDistance(uLat, uLng, assignedBranch.lat, assignedBranch.lng);

      if (distance > assignedBranch.radius) {
        return showToast('Từ Chối Chấm Công', `Lỗi vị trí! Sếp đang đứng cách [${assignedBranch.name}] khoảng ${Math.round(distance)} mét. (Yêu cầu phải trong bán kính < ${assignedBranch.radius} mét).`, 'error');
      }

      const todayStr = new Date().toLocaleDateString('en-CA');
      const timeNowStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
      const nextState = !isInShift;

      try {
        if (nextState) {
          await supabase.from('attendance').insert([{ employee_id: worker.id, employee_name: worker.full_name, work_date: todayStr, check_in: timeNowStr, shift_name: selectedShift, status: 'PRESENT' }]);
          showToast('Check-in thành công', `Hệ thống ghi nhận vào ca máy chính xác lúc ${timeNowStr}.`, 'success');
        } else {
          await supabase.from('attendance').update({ check_out: timeNowStr }).eq('employee_id', worker.id).eq('work_date', todayStr);
          showToast('Check-out thành công', `Ghi nhận rời xưởng lúc ${timeNowStr}. Hẹn gặp lại sếp!`, 'success');
        }
        setIsInShift(nextState); loadData();
      } catch (err: any) { showToast('Lỗi kết nối', err.message, 'error'); }
    }, () => { showToast('Lỗi GPS', 'Vui lòng bật quyền truy cập vị trí trên trình duyệt điện thoại!', 'error'); });
  };

  const handleUpdateTask = async (taskId: number, field: string, val: string) => {
    await supabase.from('tasks').update({ [field]: val }).eq('id', taskId);
    setProjects(prev => prev.map(p => ({
      ...p, phases: p.phases.map((ph: any) => ({
        ...ph, tasks: ph.tasks.map((t: any) => t.id === taskId ? { ...t, [field]: val } : t)
      }))
    })));
    showToast('Đồng bộ', 'Tiến độ hạng mục công việc đã cập nhật lên hệ thống!', 'success');
  };

  const submitExpense = async () => {
    if (!expCategory.trim() || !expAmount) return showToast('Thiếu thông tin', 'Vui lòng điền đủ tên vật tư và số tiền thực chi!', 'error');
    const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`.split('-').reverse().join('/');

    await supabase.from('financial_ledger').insert([{
      type: 'CHI_TIEU', category: expCategory.trim(), amount: Number(expAmount), bill_url: expBillUrl.trim(), requested_by: worker.full_name, is_paid: false, month_period: currentPeriod
    }]);

    setExpCategory(''); setExpAmount(''); setExpBillUrl(''); loadData(); 
    showToast('Thành công', 'Phiếu chi tiêu hoàn ứng kèm link ảnh bill đã gửi lên máy Admin!', 'success');
  };

  const filteredExpenses = expenses.filter(e => (e.category || '').toLowerCase().includes(expenseSearch.toLowerCase()));

  if (loading) return <div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-500 text-xs font-mono"><RefreshCcw className="w-4 h-4 animate-spin mr-2"/> Đang tải...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-5 text-slate-100 bg-slate-950 min-h-screen pb-24 font-sans">
      {/* CARD THÔNG TIN ĐỊNH DANH NHANH */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl select-none">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl"><User className="w-4 h-4" /></div>
          <div>
            <h2 className="text-xs font-black text-slate-100">{worker.full_name}</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{worker.title} • Level {worker.level}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider border uppercase ${isInShift ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>{isInShift ? '⚡ Trong Ca' : '💤 Ngoài Ca'}</span>
      </div>

      {/* TAB CA LÀM VIỆC CÓ QUET ĐỊNH VỊ GPS THEO CƠ SỞ */}
      {activeTab === 'attendance' && (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-xl max-w-md mx-auto mt-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black font-mono text-slate-100">{liveTime.toLocaleTimeString('vi-VN')}</h2>
            <p className="text-[10px] text-slate-400 font-mono">{liveTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          </div>

          <div className="w-full text-left">
            <label className="text-[10px] text-slate-400 font-bold block mb-1">Khung ca kíp đăng ký trực máy:</label>
            <select className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl font-mono text-purple-400 font-bold text-xs focus:outline-none cursor-pointer" value={selectedShift} onChange={e => setSelectedShift(e.target.value)}>
              {shiftsArray.map(sf => <option key={sf} value={sf}>⚡ {sf}</option>)}
            </select>
          </div>

          <button onClick={handleToggleShiftWithGPS} className={`w-40 h-40 rounded-full border-4 font-black text-xs tracking-wider uppercase transition-all duration-300 transform hover:scale-105 shadow-2xl flex flex-col items-center justify-center gap-2 active:scale-95 cursor-pointer ${isInShift ? 'bg-red-950/40 border-red-500 text-red-400 animate-pulse' : 'bg-emerald-950/40 border-emerald-500 text-emerald-400'}`}>
            <Power className="w-8 h-8" />
            <span>{isInShift ? 'RỜI CA VỀ' : 'VÀO CA LÀM'}</span>
          </button>
          <span className="text-[9px] text-slate-500 font-mono block text-center leading-relaxed">⚠️ GPS Geofencing: Hệ thống tự động bắt mã cơ sở phân phối để mở rào chắn tính công ca làm việc.</span>
        </div>
      )}

      {/* TAB 2: NHẬN VIỆC CHIA ĐÔI MÀN HÌNH CHỈ SỬA CỦA MÌNH */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 font-bold uppercase text-[10px] text-slate-400">Dự án tham gia</div>
            <div className="divide-y divide-slate-800/60 max-h-[350px] overflow-y-auto">
              {projects.map(p => (
                <div key={p.id} onClick={() => setViewDetailId(p.id)} className={`p-4 cursor-pointer transition text-[11px] ${viewDetailId === p.id ? 'bg-blue-950/20 border-l-4 border-blue-500 font-bold' : 'hover:bg-slate-950/20'}`}><p className="text-slate-200 font-bold text-xs">{p.name}</p></div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl min-h-[50vh]">
            {viewDetailId && (
              <div className="space-y-4">
                <h2 className="text-sm font-black text-blue-400 uppercase border-b border-slate-800 pb-3">{projects.find(p => p.id === viewDetailId)?.name}</h2>
                <div className="space-y-3">
                  {projects.find(p => p.id === viewDetailId)?.phases.map((phase: any, index: number, allPhases: any[]) => {
                    const isAllTasksDone = phase.tasks && phase.tasks.length > 0 && phase.tasks.every((t: any) => t.status === 'DONE');
                    const firstUnfinished = allPhases.find(p => !p.tasks || p.tasks.length === 0 || p.tasks.some((t: any) => t.status !== 'DONE'));
                    const status = isAllTasksDone ? 'COMPLETED' : phase.id === firstUnfinished?.id ? 'ACTIVE' : 'PENDING';
                    return (
                      <details key={phase.id} className="group bg-slate-950 border border-slate-800 rounded-xl overflow-hidden" open={status === 'ACTIVE'}>
                        <summary className={`px-4 py-3 cursor-pointer flex justify-between items-center text-xs font-bold transition select-none ${status === 'COMPLETED' ? 'bg-emerald-950/20 text-emerald-400' : status === 'ACTIVE' ? 'bg-blue-950/20 text-blue-400 border-b border-slate-800' : 'text-slate-500 opacity-60'}`}><div>Giai đoạn {index + 1}: {phase.name}</div></summary>
                        <div className="p-4 bg-slate-950 space-y-3">
                          {phase.tasks && phase.tasks.map((task: any) => {
                            const isMyTask = task.assignee === worker.full_name;
                            return (
                              <div key={task.id} className={`p-3 rounded-xl border flex flex-col space-y-3 text-[11px] ${isMyTask ? 'bg-slate-900 border-blue-500/30' : 'bg-slate-950/40 border-slate-850 opacity-40'}`}>
                                <div className="flex justify-between items-start gap-2">
                                  <div><p className="font-bold text-slate-200">{task.name}</p><p className="text-[10px] text-slate-500 font-mono">Thợ gán: {task.assignee}</p></div>
                                  <select disabled={!isMyTask} className="p-1.5 border rounded-lg text-[10px] bg-slate-950 font-black cursor-pointer text-slate-200" value={task.status} onChange={(e) => handleUpdateTask(task.id, 'status', e.target.value)}>
                                    <option value="TODO">⏳ CHỜ LÀM</option><option value="DOING">⚡ ĐANG LÀM</option><option value="DONE">✓ ĐÃ XONG</option>
                                  </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div><label className="text-[9px] text-slate-500 font-bold block mb-1">ESTIMATE TIMELINE:</label><input disabled={!isMyTask} type="text" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg font-mono text-[10px] text-amber-400 focus:outline-none" value={task.deadline || ''} onChange={(e) => handleUpdateTask(task.id, 'deadline', e.target.value)} /></div>
                                  <div className="sm:col-span-2"><label className="text-[9px] text-slate-500 font-bold block mb-1">LINK GOOGLE DRIVE KẾT QUẢ SẢN PHẨM MẪU:</label><input disabled={!isMyTask} type="text" className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-[10px] text-slate-300 focus:outline-none" value={task.note || ''} onChange={(e) => handleUpdateTask(task.id, 'note', e.target.value)} /></div>
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

      {/* TAB 3: BÁO CHI TIÊU KÊ KHAI VẬT TƯ CHỈ HIỂN THỊ CỦA BẢN THÂN NHÂN VIÊN ĐÓ */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs shadow-xl">
            <span className="text-[10px] font-black uppercase text-slate-400 block border-b border-slate-800 pb-2">Tạo phiếu mua đồ vật tư</span>
            <div><label className="text-slate-400">Tên đồ vật tư:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none text-slate-200" value={expCategory} onChange={(e) => setExpCategory(e.target.value)} /></div>
            <div><label className="text-slate-400">Giá tiền thực chi (VND):</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 font-mono text-amber-400 font-bold" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} /></div>
            <div><label className="text-slate-400">Link ảnh chụp hóa đơn bill (Zalo/Drive):</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none text-blue-400 font-mono" value={expBillUrl} onChange={(e) => setExpBillUrl(e.target.value)} /></div>
            <button onClick={submitExpense} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl flex justify-center gap-1.5"><Save className="w-4 h-4" /> Nộp Phiếu Về Máy Sếp</button>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold uppercase text-slate-400">Sổ Đối Soát Tiền Mặt Chi Tiêu Hoàn Ứng Vật Tư Của Tôi</div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[9px]">
                <tr><th className="p-3">Nội dung</th><th className="p-3">Số tiền</th><th className="p-3 text-center">Trạng thái quỹ</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-[11px]">
                {filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-950/10">
                    <td className="p-3 font-bold text-slate-200">{e.category} {e.bill_url && <a href={e.bill_url} target="_blank" className="text-blue-400 flex items-center gap-1 mt-1 text-[9px] hover:underline font-mono"><ImageIcon className="w-3 h-3"/> Mở Xem Bill</a>}</td>
                    <td className="p-3 font-mono text-red-400">{Number(e.amount).toLocaleString()} đ</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded font-black text-[9px] border ${e.is_paid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>{e.is_paid ? 'ĐÃ TRẢ' : 'TREO NỢ'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: HỒ SƠ THÔNG TIN CÁ NHÂN BẢN THÂN & CONTRACT LINK */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl max-w-2xl mx-auto space-y-5 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3"><Briefcase className="w-4 h-4 text-blue-400" /><h2 className="font-bold text-slate-200 uppercase tracking-wider text-[12px]">Hồ Sơ Thành Viên Số Hóa</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-slate-500 block mb-1">Số điện thoại:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl focus:outline-none text-slate-200" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} /></div>
            <div><label className="text-slate-500 block mb-1">Tên Ngân hàng thụ hưởng:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl focus:outline-none text-slate-200" value={profileBankName} onChange={e => setProfileBankName(e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="text-slate-500 block mb-1">Số tài khoản nhận tiền lương quỹ:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl focus:outline-none text-amber-400 font-bold font-mono" value={profileBankAcc} onChange={e => setProfileBankAcc(e.target.value)} /></div>
          </div>
          <button onClick={() => { supabase.from('employees').update({ phone: profilePhone.trim(), bank_name: profileBankName.trim(), bank_account_number: profileBankAcc.trim() }).eq('id', worker.id).then(() => showToast('Thành công', 'Đã lưu cấu hình tài khoản lương thụ động!', 'success')); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black p-3 rounded-xl transition shadow-lg">Lưu cấu hình thông tin cá nhân</button>
          
          <div className="pt-4 border-t border-slate-800 mt-3">
            <label className="text-slate-500 block mb-2 font-bold uppercase text-[9px] tracking-wider font-mono">Bản sao hợp đồng lao động số hóa xem link từ bên quản lý nhân sự:</label>
            {worker.drive_contract ? <a href={worker.drive_contract} target="_blank" className="block w-full bg-slate-950 border border-slate-700 hover:border-blue-500 text-blue-400 font-bold p-3 rounded-xl text-center transition hover:bg-slate-900 font-mono">📥 MỞ XEM BẢN SCAN PDF HỢP ĐỒNG LAO ĐỘNG</a> : <div className="w-full bg-slate-950/40 border border-slate-800 border-dashed p-3 rounded-xl text-slate-600 text-center italic font-mono">Hệ thống quản lý chưa tải bản scan hợp đồng của bạn lên.</div>}
          </div>
        </div>
      )}

      {/* CHÂN MENU TÁC VỤ CỦA TÔI */}
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
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex justify-center items-center text-slate-500 text-xs font-mono">Loading Portal...</div>}>
      <StaffPortalContent />
    </Suspense>
  );
}