// app/admin/attendance/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/component/NotificationContext';
import { Calendar as CalendarIcon, Clock, RefreshCcw, LayoutGrid, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

export default function AdminAttendanceManagement() {
  const { showToast } = useNotification();
  const [employees, setEmployees] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedShiftName, setSelectedShiftName] = useState('');
  const [checkType, setCheckType] = useState('IN');
  const [filterEmployeeId, setFilterEmployeeId] = useState('ALL');

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); 
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [showPickerPopup, setShowPickerPopup] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerHour, setPickerHour] = useState('08');
  const [pickerMinute, setPickerMinute] = useState('00');
  const [pickerPeriod, setPickerPeriod] = useState('AM');

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: emps } = await supabase.from('employees').select('id, full_name, title');
      setEmployees(emps || []);
      const { data: sfs } = await supabase.from('shifts').select('*');
      let finalShifts = sfs || [];
      if (!finalShifts.some(s => s.shift_name.includes('Tối'))) {
        finalShifts.push({ id: 't_mock', shift_name: 'Ca Tối', start_time: '18:00:00', end_time: '22:00:00' });
      }
      setShifts(finalShifts);
      if (finalShifts.length > 0 && !selectedShiftName) setSelectedShiftName(finalShifts[0].shift_name);
      const { data: atts } = await supabase.from('attendance').select('*').order('work_date', { ascending: false });
      setAttendanceRecords(atts || []);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getFormattedTime24h = () => {
    let hour = parseInt(pickerHour);
    if (pickerPeriod === 'PM' && hour !== 12) hour += 12;
    if (pickerPeriod === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${pickerMinute}:00`;
  };

  const handleAdminCheckIn = async () => {
    if (!selectedEmpId) return showToast('Thiếu thông tin', 'Vui lòng chọn thợ cần tính công!', 'error');
    const emp = employees.find(e => String(e.id) === String(selectedEmpId));
    if (!emp) return;

    const targetDateStr = pickerDate.toLocaleDateString('en-CA');
    const targetTimeStr = getFormattedTime24h();

    try {
      const { data: existing } = await supabase.from('attendance').select('*').eq('employee_id', emp.id).eq('work_date', targetDateStr).eq('shift_name', selectedShiftName).maybeSingle();

      if (checkType === 'IN') {
        if (existing) await supabase.from('attendance').update({ check_in: targetTimeStr }).eq('id', existing.id);
        else await supabase.from('attendance').insert([{ employee_id: emp.id, employee_name: emp.full_name, work_date: targetDateStr, check_in: targetTimeStr, shift_name: selectedShiftName, status: 'PRESENT' }]);
        setCheckType('OUT');
      } else {
        if (existing) await supabase.from('attendance').update({ check_out: targetTimeStr }).eq('id', existing.id);
        else await supabase.from('attendance').insert([{ employee_id: emp.id, employee_name: emp.full_name, work_date: targetDateStr, check_out: targetTimeStr, shift_name: selectedShiftName, status: 'PRESENT' }]);
        setCheckType('IN');
      }
      showToast('Đồng bộ thành công', `Đã lưu thông số công ca cho thợ [${emp.full_name}] xuống hệ thống.`, 'success');
      loadData();
    } catch (err: any) { showToast('Lỗi kết nối', err.message, 'error'); }
  };

  const handleGridDayClick = (dayStr: string) => {
    const clickedDate = new Date(dayStr);
    setPickerDate(clickedDate);
 };

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-base font-bold flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-purple-500" /> Bảng Điều Hành Chấm Công Admin</h1>
        <button onClick={loadData} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400"><RefreshCcw className="w-4 h-4"/></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h2 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5 border-b border-slate-800 pb-3"><Clock className="w-4 h-4" /> Điểm danh thủ công Admin</h2>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">1. Chọn thành viên xưởng:</label>
              <select className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-200 focus:outline-none cursor-pointer" value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}>
                <option value="">-- Click chọn thợ xưởng --</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.title})</option>)}
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">2. Chọn ca kíp trực:</label>
              <select className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-200 focus:outline-none cursor-pointer" value={selectedShiftName} onChange={e => setSelectedShiftName(e.target.value)}>
                {shifts.map(s => <option key={s.id} value={s.shift_name}>⚙️ {s.shift_name}</option>)}
              </select>
            </div>

            <div className="relative">
              <label className="text-slate-400 font-bold block mb-1"><CalendarDays className="w-3.5 h-3.5 text-purple-400 inline mr-1" />3. Cấu hình Ngày & Giờ (Bản vị số hóa):</label>
              <div onClick={() => setShowPickerPopup(!showPickerPopup)} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-purple-400 font-bold text-center cursor-pointer hover:border-purple-500 transition">
                📅 {pickerDate.toLocaleDateString('vi-VN')} — ⏱️ {pickerHour}:{pickerMinute} {pickerPeriod}
              </div>

              {showPickerPopup && (
                <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-purple-500/40 p-4 rounded-2xl shadow-2xl z-50 space-y-3 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-black text-purple-400 text-[10px] uppercase">Bảng điều phối mốc thời gian</span>
                    <button onClick={() => setShowPickerPopup(false)} className="text-slate-400 hover:text-white font-bold text-xs">OK</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Đổi ngày lùi:</label>
                      <input type="date" className="w-full bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-200 font-mono focus:outline-none" value={pickerDate.toLocaleDateString('en-CA')} onChange={(e) => { if(e.target.value) setPickerDate(new Date(e.target.value)) }} />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Khung giờ:</label>
                      <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-center font-mono font-bold text-xs">
                        <select className="bg-transparent focus:outline-none cursor-pointer w-1/3 text-amber-400" value={pickerHour} onChange={e => setPickerHour(e.target.value)}>
                          {Array.from({length: 12}, (_, i) => String(i+1).padStart(2,'0')).map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span>:</span>
                        <select className="bg-transparent focus:outline-none cursor-pointer w-1/3 text-amber-400" value={pickerMinute} onChange={e => setPickerMinute(e.target.value)}>
                          {Array.from({length: 60}, (_, i) => String(i).padStart(2,'0')).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select className="bg-transparent focus:outline-none cursor-pointer w-1/3 text-purple-400" value={pickerPeriod} onChange={e => setPickerPeriod(e.target.value)}>
                          <option value="AM">AM</option><option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">4. Trạng thái ca kíp:</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => setCheckType('IN')} className={`p-2.5 rounded-xl font-black text-[11px] transition ${checkType === 'IN' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-950 text-slate-500 border border-slate-850'}`}>🟢 VÀO CA</button>
                <button onClick={() => setCheckType('OUT')} className={`p-2.5 rounded-xl font-black text-[11px] transition ${checkType === 'OUT' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-950 text-slate-500 border border-slate-850'}`}>🔴 RỜI CA</button>
              </div>
            </div>
            <button onClick={handleAdminCheckIn} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black p-3 rounded-xl transition text-xs shadow-lg">✓ Thực thi hạch toán Cloud</button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 border-b border-slate-800/60 pb-3">
            <h2 className="text-sm font-black text-slate-100 uppercase tracking-wide flex items-center gap-1.5"><LayoutGrid className="w-4 h-4 text-purple-400" /> Bảng phân lịch đối soát ca trực</h2>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <select className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none cursor-pointer" value={filterEmployeeId} onChange={e => setFilterEmployeeId(e.target.value)}>
                <option value="ALL">👥 Tất cả nhân sự</option>
                {employees.map(e => <option key={e.id} value={e.id}>👤 {e.full_name}</option>)}
              </select>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button onClick={() => { if(currentMonth===0){setCurrentMonth(11); setCurrentYear(y=>y-1);}else{setCurrentMonth(m=>m-1);} }} className="p-1 text-slate-400 hover:text-white"><ChevronLeft className="w-4 h-4"/></button>
                <span className="text-xs font-black font-mono px-2 text-purple-400 uppercase select-none w-28 text-center">THÁNG {currentMonth + 1} / {currentYear}</span>
                <button onClick={() => { if(currentMonth===11){setCurrentMonth(0); setCurrentYear(y=>y+1);}else{setCurrentMonth(m=>m+1);} }} className="p-1 text-slate-400 hover:text-white"><ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 select-none">
            <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="bg-slate-950/20 border border-transparent min-h-[75px] rounded-xl opacity-20"></div>)}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const currentLoopDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              let rawDayRecords = attendanceRecords.filter(r => r.work_date === currentLoopDateStr);
              if (filterEmployeeId !== 'ALL') rawDayRecords = rawDayRecords.filter(r => String(r.employee_id) === String(filterEmployeeId));

              const uniqueDayRecordsMap: { [key: string]: any } = {};
              rawDayRecords.forEach(rec => {
                const uniqueKey = `${rec.employee_id}-${rec.shift_name}`;
                if (!uniqueDayRecordsMap[uniqueKey]) uniqueDayRecordsMap[uniqueKey] = { ...rec };
                else {
                  if (rec.check_in && !uniqueDayRecordsMap[uniqueKey].check_in) uniqueDayRecordsMap[uniqueKey].check_in = rec.check_in;
                  if (rec.check_out && !uniqueDayRecordsMap[uniqueKey].check_out) uniqueDayRecordsMap[uniqueKey].check_out = rec.check_out;
                }
              });

              const processedDayRecords = Object.values(uniqueDayRecordsMap);

              return (
                <div key={`day-${day}`} onClick={() => handleGridDayClick(currentLoopDateStr)} className={`group relative min-h-[85px] p-2 rounded-xl bg-slate-950 border transition-all flex flex-col justify-between cursor-pointer ${processedDayRecords.length > 0 ? 'border-purple-900/40 bg-gradient-to-b from-slate-950 to-purple-950/10 shadow-lg' : 'border-slate-850 hover:border-slate-700'}`}>
                  <span className={`text-[11px] font-mono font-black ${processedDayRecords.length > 0 ? 'text-purple-400' : 'text-slate-400'}`}>{day}</span>
                  <div>{processedDayRecords.length > 0 && <span className="block text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded px-1 py-0.5 font-bold uppercase truncate">👥 {processedDayRecords.length} lượt ca</span>}</div>

                  {processedDayRecords.length > 0 && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 border border-purple-500/40 p-3 rounded-xl shadow-2xl text-[10px] w-56 z-50 text-left space-y-1.5 font-sans">
                      <p className="font-black text-purple-400 border-b border-slate-800 pb-1 font-mono uppercase tracking-wider">📅 Chi tiết ngày {day}/{currentMonth + 1}:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {processedDayRecords.map((rec: any, rIdx) => (
                          <div key={rec.id || rIdx} className="border-b border-slate-850/50 pb-1.5 last:border-none last:pb-0">
                            <p className="font-black text-slate-200">👤 {rec.employee_name}</p>
                            <p className="text-[9px] text-amber-400 font-medium font-mono">⏰ Ca: {rec.shift_name}</p>
                            <div className="grid grid-cols-2 gap-1 font-mono text-[9px] mt-0.5">
                              <span className="text-emerald-400 font-bold">Vào: {rec.check_in ? rec.check_in.slice(0,5) : '--:--'}</span>
                              <span className="text-red-400 font-bold">Ra: {rec.check_out ? rec.check_out.slice(0,5) : '--:--'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}