// app/admin/metadata/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, Plus, Trash2, Save, RefreshCcw, Layers, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function MetadataManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Bộ lọc & Phân trang danh mục hợp nhất
  const [selectedCatId, setSelectedCatId] = useState<string>(''); // Filter chọn Danh mục lớn
  const [subSearchTerm, setSubSearchTerm] = useState<string>(''); // Filter ô tìm kiếm góc bảng
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Đặt chuẩn hiển thị tối đa 8 dòng dữ liệu/trang

  // Form tạo danh mục lớn mới
  const [newCatName, setNewCatName] = useState('');

  const loadMetadata = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('system_metadata').select('*').order('id', { ascending: true });
      setCategories(data || []);
      
      // Tự động chọn danh mục lớn đầu tiên nếu chưa chọn cái nào
      if (data && data.length > 0 && !selectedCatId) {
        setSelectedCatId(data[0].id.toString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMetadata(); }, []);

  // Mỗi lần sếp đổi danh mục lớn ➔ Reset trang về 1 và xóa từ khóa tìm kiếm con
  const handleCategoryFilterChange = (catId: string) => {
    setSelectedCatId(catId);
    setCurrentPage(1);
    setSubSearchTerm('');
  };

  // TÌM KIẾM VÀ PHÂN TRANG LOGIC TRÊN BẢNG HỢP NHẤT
  const activeCategory = categories.find(c => c.id === Number(selectedCatId));
  const activeData = activeCategory ? activeCategory.data || [] : [];

  // Gắn chỉ mục toàn cục ngầm để khi sếp filter hay phân trang thì sửa dữ liệu vẫn ăn đúng dòng gốc
  const rowsWithGlobalIndex = activeData.map((row: any, index: number) => ({
    ...row,
    __globalIndex: index
  }));

  // Lọc dữ liệu theo ô Filter tìm kiếm góc bảng
  const filteredRows = rowsWithGlobalIndex.filter((row: any) => {
    return Object.keys(row).some(key => {
      if (key === '__globalIndex') return false;
      return String(row[key]).toLowerCase().includes(subSearchTerm.toLowerCase());
    });
  });

  // Tính toán chia trang dữ liệu con
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Đọc động các thuộc tính Key trong JSON của danh mục đang chọn để dựng cột tiêu đề bảng
  const tableHeaders = activeData.length > 0 
    ? Object.keys(activeData[0]).filter(k => k !== '__globalIndex') 
    : [];

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const { data, error } = await supabase.from('system_metadata').insert([{ name: newCatName.trim(), data: [] }]).select();
    if (data && data.length > 0) {
      setSelectedCatId(data[0].id.toString());
    }
    setNewCatName('');
    loadMetadata();
    alert('✨ Đã khởi tạo danh mục lớn mới thành công!');
  };

  const handleDeleteCategory = async () => {
    if (!activeCategory) return;
    if (window.confirm(`⚠️ CẢNH BÁO BẢO MẬT: Hành động này sẽ xóa vĩnh viễn danh mục lớn [${activeCategory.name}] khỏi xưởng. Sếp chắc chắn chứ?`)) {
      await supabase.from('system_metadata').delete().eq('id', activeCategory.id);
      setSelectedCatId('');
      loadMetadata();
      alert('Đã dọn dẹp danh mục lớn thành công!');
    }
  };

  // THUẬT TOÁN ĐỘNG: Tạo dòng con trống khớp mẫu thuộc tính theo tên Danh mục lớn sếp đang chọn
  const handleAddRow = () => {
    if (!activeCategory) return;
    let newRow = {};
    const nameLower = activeCategory.name.toLowerCase();
    
    if (nameLower.includes('cấp bậc & lương')) {
      newRow = { level: 'Bậc mới', rate: 30000 };
    } else if (nameLower.includes('vị trí & cấp bậc')) {
      newRow = { title: 'Vị trí mới', level: 'A1' };
    } else if (nameLower.includes('ngân hàng')) {
      newRow = { name: 'Tên ngân hàng', code: 'MÃ' };
    } else if (nameLower.includes('nghiệp vụ')) {
      newRow = { code: 'MA_CODE', label: 'Tên hiển thị' };
    } else {
      // Mẫu fallback nếu sếp tự tạo danh mục tùy biến bên ngoài
      newRow = tableHeaders.length > 0 
        ? tableHeaders.reduce((acc, currentKey) => ({ ...acc, [currentKey]: currentKey === 'rate' ? 0 : 'Nhập dữ liệu' }), {})
        : { key: 'Nhãn', value: 'Giá trị' };
    }

    const updatedData = [...activeCategory.data, newRow];
    setCategories(categories.map(c => c.id === activeCategory.id ? { ...c, data: updatedData } : c));
    
    // Đẩy phân trang về trang cuối cùng để sếp nhìn thấy dòng vừa thêm
    setTimeout(() => {
      const newTotalPages = Math.ceil(updatedData.length / itemsPerPage);
      setCurrentPage(newTotalPages || 1);
    }, 50);
  };

  const handleUpdateRowValue = (globalIndex: number, field: string, value: any) => {
    if (!activeCategory) return;
    const newData = [...activeCategory.data];
    newData[globalIndex] = { 
      ...newData[globalIndex], 
      [field]: field === 'rate' ? Number(value) : value 
    };
    setCategories(categories.map(c => c.id === activeCategory.id ? { ...c, data: newData } : c));
  };

  const handleRemoveRow = (globalIndex: number) => {
    if (!activeCategory) return;
    const newData = activeCategory.data.filter((_, i) => i !== globalIndex);
    setCategories(categories.map(c => c.id === activeCategory.id ? { ...c, data: newData } : c));
    
    // Điều chỉnh lại số trang hiện tại nếu dòng bị xóa làm hụt trang
    const maxPage = Math.ceil(newData.length / itemsPerPage) || 1;
    if (currentPage > maxPage) setCurrentPage(maxPage);
  };

  const handleSaveCategory = async () => {
    if (!activeCategory) return;
    const { error } = await supabase.from('system_metadata').update({ data: activeCategory.data }).eq('id', activeCategory.id);
    if (error) {
      alert('❌ Lỗi lưu dữ liệu: ' + error.message);
    } else {
      alert(`✨ Toàn bộ dữ liệu của danh mục lớn [${activeCategory.name}] đã được đồng bộ lên Cloud DB!`);
    }
  };

  const getFieldPlaceholder = (key: string) => {
    const labels: { [key: string]: string } = {
      level: 'Cấp bậc (A1, A2...)',
      rate: 'Mức lương cơ bản (đ/Giờ)',
      title: 'Chức danh thợ xưởng',
      name: 'Tên ngân hàng',
      code: 'Mã viết tắt chuẩn',
      label: 'Tên nghiệp vụ'
    };
    return labels[key] || `Cấu hình (${key})`;
  };

  if (loading) return <div className="p-6 text-xs text-center font-mono text-slate-500"><RefreshCcw className="w-4 h-4 animate-spin inline mr-2" /> Đang tối ưu cấu trúc bảng phân trang...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen font-sans">
      
      {/* TOP BAR: KHỞI TẠO DANH MỤC MỚI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <div>
            <h1 className="text-base font-bold">Hệ Thống Danh Mục Metadata Trung Tâm</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Bảng hợp nhất tối ưu hiệu năng phân trang dành cho chuỗi xưởng quy mô lớn</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs">
          <input 
            type="text" 
            placeholder="Tạo Danh mục lớn mới..." 
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none w-44" 
            value={newCatName} 
            onChange={(e) => setNewCatName(e.target.value)} 
          />
          <button onClick={handleCreateCategory} className="bg-purple-600 hover:bg-purple-700 font-bold px-3 py-1.5 rounded-lg text-white transition flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Tạo lớn
          </button>
        </div>
      </div>

      {/* CHUNG 1 BẢNG TẬP TRUNG CHUYÊN NGHIỆP */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
        
        {/* HEADER ĐIỀU KHIỂN CỦA BẢNG (FILTER TRÁI VÀ FILTER TRÊN GÓC PHẢI BẢNG) */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* FILTER BÊN TRÁI: CHỌN DANH MỤC LỚN */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Database className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Danh mục lớn:</span>
            <select 
              className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-purple-300 font-black focus:outline-none w-full md:w-64"
              value={selectedCatId}
              onChange={(e) => handleCategoryFilterChange(e.target.value)}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>📁 {c.name} ({c.data?.length || 0})</option>
              ))}
            </select>
          </div>

          {/* FILTER TRÊN GÓC BẢNG BÊN PHẢI: Ô SEARCH BOX CON VÀ NÚT LƯU/XÓA TỔNG */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="relative w-full md:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Tìm nội dung con..." 
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500/50" 
                value={subSearchTerm} 
                onChange={(e) => { setSubSearchTerm(e.target.value); setCurrentPage(1); }} 
              />
            </div>
            
            <button onClick={handleSaveCategory} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition shrink-0" title="Ghi đè cấu trúc xuống DB">
              <Save className="w-3.5 h-3.5" /> Lưu bảng
            </button>
            <button onClick={handleDeleteCategory} className="bg-slate-950 border border-slate-800 hover:bg-red-950/40 text-slate-500 hover:text-red-400 p-2 rounded-lg transition shrink-0" title="Xóa sổ danh mục lớn này">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* THÂN BẢNG TỰ THÍCH ỨNG THEO ĐỊNH DẠNG DATA TRÊN KỲ PHÂN TRANG */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 table-fixed min-w-[600px]">
            <thead className="bg-slate-950 text-slate-500 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                {tableHeaders.map(header => (
                  <th key={header} className="p-4 font-bold text-slate-400">{header} (Trường dữ liệu)</th>
                ))}
                <th className="p-4 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={tableHeaders.length + 1} className="p-8 text-center text-slate-500 font-mono">
                    Chưa có hàng dữ liệu nào được khởi tạo hoặc từ khóa không khớp.
                  </td>
                </tr>
              ) : paginatedRows.map((row) => (
                <tr key={row.__globalIndex} className="hover:bg-slate-950/30 transition">
                  {tableHeaders.map((key) => (
                    <td key={key} className="p-3">
                      <input 
                        type={key === 'rate' ? 'number' : 'text'}
                        className={`w-full bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/30 ${key === 'code' || key === 'level' || key === 'rate' ? 'font-mono text-amber-400 font-bold' : ''}`}
                        value={row[key] !== undefined ? row[key] : ''}
                        onChange={(e) => handleUpdateRowValue(row.__globalIndex, key, e.target.value)}
                        placeholder={getFieldPlaceholder(key)}
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => handleRemoveRow(row.__globalIndex)}
                      className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Xóa dòng con này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PHẦN ĐUÔI BẢNG: NÚT THÊM MỚI DÒNG VÀ ĐIỀU KHIỂN PHÂN TRANG */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs shrink-0">
          <button onClick={handleAddRow} className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition focus:outline-none">
            <Plus className="w-4 h-4" /> Thêm hàng con mới vào bảng
          </button>

          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-mono">
                Trang {currentPage} / {totalPages} (Tổng số con: {filteredRows.length})
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg disabled:opacity-20 transition"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-300" />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg disabled:opacity-20 transition"
                >
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}