// component/MonthPicker.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, ChevronDown } from 'lucide-react';

interface MonthPickerProps {
  value: string; // Định dạng dữ liệu liên thông: YYYY-MM
  onChange: (newValue: string) => void;
  accent?: 'default' | 'purple'; // Phân biệt giao diện Quản lý quỹ (emerald) và Chấm công (purple)
}

// Danh mục hiển thị viết tắt chuẩn hóa theo dạng lưới chữ nhật gọn gàng
const MONTH_LABELS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export default function MonthPicker({ value, onChange, accent = 'default' }: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR'>('MONTH');
  
  // Tách giá trị thời gian thực tế từ props
  const selectedYear = value ? parseInt(value.split('-')[0]) : new Date().getFullYear();
  const selectedMonth = value ? parseInt(value.split('-')[1]) : new Date().getMonth() + 1;

  // State lưu năm điều hướng trung gian khi người dùng lật trang trong popup
  const [navYear, setNavYear] = useState<number>(selectedYear);
  const pickerContainerRef = useRef<HTMLDivElement>(null);

  // Logic tự động đóng Popover khi người dùng click ra ngoài vùng chọn
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

  // Đồng bộ năm điều hướng khi giá trị thời gian tổng thay đổi
  useEffect(() => {
    if (value) {
      setNavYear(parseInt(value.split('-')[0]));
    }
  }, [value]);

  // Thao tác nhanh: Lùi 1 tháng qua nút bấm mũi tên bên ngoài
  const handleStepPrev = () => {
    let y = selectedYear;
    let m = selectedMonth - 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    onChange(`${y}-${String(m).padStart(2, '0')}`);
  };

  // Thao tác nhanh: Tiến 1 tháng qua nút bấm mũi tên bên ngoài
  const handleStepNext = () => {
    let y = selectedYear;
    let m = selectedMonth + 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
    onChange(`${y}-${String(m).padStart(2, '0')}`);
  };

  // Xử lý sự kiện click chọn tháng trên lưới
  const handleMonthClick = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, '0');
    onChange(`${navYear}-${formattedMonth}`);
    setIsOpen(false); // Chọn xong tháng thì đóng popup luôn
  };

  // Xử lý sự kiện click chọn năm trên lưới
  const handleYearClick = (year: number) => {
    setNavYear(year);
    setViewMode('MONTH'); // Chọn năm xong tự động quay lại lưới chọn tháng
  };

  // Tính toán lưới dải 12 năm hiển thị (Cố định khung hình chữ nhật 3x4)
  const startYearRange = Math.floor(navYear / 12) * 12;
  const yearsGridArray = Array.from({ length: 12 }, (_, i) => startYearRange + i);

  // Cấu hình mã màu đồng bộ theo chuẩn thiết kế ERP của từng phân hệ
  const textColor = accent === 'purple' ? 'text-purple-400' : 'text-emerald-400';
  const bgColor = accent === 'purple' ? 'bg-purple-600' : 'bg-emerald-600';
  const hoverColor = accent === 'purple' ? 'hover:bg-purple-500/20 hover:text-purple-300' : 'hover:bg-emerald-500/20 hover:text-emerald-300';
  const borderTheme = accent === 'purple' ? 'border-purple-500/30' : 'border-emerald-500/30';

  return (
    <div className="relative flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 select-none" ref={pickerContainerRef}>
      {/* Nút bấm mũi tên lùi nhanh bên trái */}
      <button onClick={() => handleStepPrev()} className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-900">
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      {/* Khung hiển thị trung tâm đóng vai trò nút kích hoạt Popover */}
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

      {/* Nút bấm mũi tên tiến nhanh bên phải */}
      <button onClick={() => handleStepNext()} className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-900">
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* BẢNG CHỌN TIẾN TIẾN DẠNG LƯỚI KHÔNG THANH CUỘN (MATERIAL GRID POPUP) */}
      {isOpen && (
        <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-900 border ${borderTheme} rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}>
          
          {/* Thanh điều khiển trên đầu Popup */}
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
            
            {/* Nhấp vào phần text hiển thị ở giữa để đổi chế độ lưới xem Tháng <=> xem Năm */}
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

          {/* Vùng hiển thị ma trận các ô lựa chọn */}
          <div className="p-3 bg-slate-900">
            {viewMode === 'MONTH' ? (
              // Chế độ 1: Lưới 3 cột x 4 hàng chọn THÁNG (Tuyệt đối không có thanh cuộn dọc)
              <div className="grid grid-cols-3 gap-2">
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
              // Chế độ 2: Lưới 3 cột x 4 hàng chọn NĂM (Tuyệt đối không có thanh cuộn dọc)
              <div className="grid grid-cols-3 gap-2">
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