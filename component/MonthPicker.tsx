// component/MonthPicker.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, ChevronDown } from 'lucide-react';

interface MonthPickerProps {
  value: string; // Định dạng kết nối dữ liệu: YYYY-MM
  onChange: (newValue: string) => void;
  accent?: 'default' | 'purple'; // Định hình màu sắc cho Sổ cái (emerald) hoặc Chấm công (purple)
}

const MONTH_LABELS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export default function MonthPicker({ value, onChange, accent = 'default' }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR'>('MONTH');
  
  const selectedYear = value ? parseInt(value.split('-')[0]) : new Date().getFullYear();
  const selectedMonth = value ? parseInt(value.split('-')[1]) : new Date().getMonth() + 1;

  const [navYear, setNavYear] = useState<number>(selectedYear);
  const pickerContainerRef = useRef<HTMLDivElement>(null);

  // Tự động đóng Popover khi người dùng nhấp chuột ra ngoài vùng chọn
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (pickerContainerRef.current && !pickerContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  useEffect(() => {
    if (value) {
      setNavYear(parseInt(value.split('-')[0]));
    }
  }, [value]);

  const handleStepPrev = () => {
    let y = selectedYear;
    let m = selectedMonth - 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    onChange(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleStepNext = () => {
    let y = selectedYear;
    let m = selectedMonth + 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
    onChange(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleMonthClick = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, '0');
    onChange(`${navYear}-${formattedMonth}`);
    setIsOpen(false);
  };

  const handleYearClick = (year: number) => {
    setNavYear(year);
    setViewMode('MONTH');
  };

  const startYearRange = Math.floor(navYear / 12) * 12;
  const yearsGridArray = Array.from({ length: 12 }, (_, i) => startYearRange + i);

  const textColor = accent === 'purple' ? 'text-purple-400' : 'text-emerald-400';
  const bgColor = accent === 'purple' ? 'bg-purple-600' : 'bg-emerald-600';
  const hoverColor = accent === 'purple' ? 'hover:bg-purple-500/20 hover:text-purple-300' : 'hover:bg-emerald-500/20 hover:text-emerald-300';
  const borderTheme = accent === 'purple' ? 'border-purple-500/30' : 'border-emerald-500/30';

  return (
    /* Ép bắt buộc cấu hình relative cho container bọc ngoài cùng */
    <div 
      className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 select-none" 
      ref={pickerContainerRef}
      style={{ position: 'relative' }}
    >
      {/* Mũi tên điều hướng lùi */}
      <button onClick={handleStepPrev} className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-900">
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      {/* Nút chính hiển thị thông số kỳ hạn để click mở Popup */}
      <button 
        onClick={() => { setIsOpen(!isOpen); setViewMode('MONTH'); setNavYear(selectedYear); }}
        className={`flex items-center justify-center gap-2 px-3 py-1.5 min-w-[145px] rounded-lg transition group hover:bg-slate-900 ${textColor}`}
      >
        <CalendarDays className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition" />
        <span className="text-xs font-black font-mono tracking-wide mt-0.5">
          Tháng {String(selectedMonth).padStart(2, '0')} / {selectedYear}
        </span>
        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
      </button>

      {/* Mũi tên điều hướng tiến */}
      <button onClick={handleStepNext} className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-900">
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* BẢNG CHỌN TIẾN TIẾN DẠNG LƯỚI 3x4 ÉP ĐỊNH VỊ CHUẨN XUỐNG DƯỚI NÚT BẤM */}
      {isOpen && (
        <div 
          className={`bg-slate-900 border ${borderTheme} rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
          style={{ 
            position: 'absolute', 
            top: '100%', 
            right: 0, 
            marginTop: '0.5rem', 
            zIndex: 100,
            width: '16rem' 
          }}
        >
          {/* Thanh điều khiển điều hướng năm bên trong Popup */}
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-800 bg-slate-950/60">
            <button 
              onClick={() => {
                if (viewMode === 'MONTH') setNavYear(prev => prev - 1);
                else setNavYear(prev => prev - 12);
              }} 
              className="p-1 text-slate-400 hover:text-white rounded bg-slate-950 border border-slate-800 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            <button 
              onClick={() => setViewMode(viewMode === 'MONTH' ? 'YEAR' : 'MONTH')}
              className={`text-xs font-black font-mono tracking-wider hover:underline uppercase ${textColor}`}
            >
              {viewMode === 'MONTH' ? `Năm ${navYear}` : `${yearsGridArray[0]} - ${yearsGridArray[11]}`}
            </button>

            <button 
              onClick={() => {
                if (viewMode === 'MONTH') setNavYear(prev => prev + 1);
                else setNavYear(prev => prev + 12);
              }} 
              className="p-1 text-slate-400 hover:text-white rounded bg-slate-950 border border-slate-800 transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Khối Grid ma trận hiển thị 3x4 phẳng */}
          <div className="p-3 bg-slate-900">
            {viewMode === 'MONTH' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem' }}>
                {MONTH_LABELS.map((label, index) => {
                  const isCurrentActive = selectedYear === navYear && selectedMonth === index + 1;
                  return (
                    <button
                      key={index}
                      onClick={() => handleMonthClick(index)}
                      className={`py-2.5 rounded-xl text-[10px] font-bold tracking-tight transition text-center
                        ${isCurrentActive 
                          ? `${bgColor} text-white shadow-md font-black` 
                          : `text-slate-300 bg-slate-950 border border-slate-800/60 ${hoverColor}`
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem' }}>
                {yearsGridArray.map((year) => {
                  const isCurrentActive = selectedYear === year;
                  return (
                    <button
                      key={year}
                      onClick={() => handleYearClick(year)}
                      className={`py-2.5 rounded-xl text-xs font-mono font-bold transition text-center
                        ${isCurrentActive 
                          ? `${bgColor} text-white shadow-md font-black` 
                          : `text-slate-300 bg-slate-950 border border-slate-800/60 ${hoverColor}`
                        }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}