// app/admin/settings/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useNotification } from '@/component/NotificationContext';
import { Sliders, Plus, Trash2, Save, RefreshCcw, Eye, EyeOff, X, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function AdminSystemSettings() {
  const { showToast, showConfirm } = useNotification();
  const [settings, setSettings] = useState<any[]>([]);
  const [configGroups, setConfigGroups] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Bộ lọc, Tìm kiếm nâng cao & Phân trang chuẩn Enterprise
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 
  const [pageInput, setPageInput] = useState('1');

  // Form States Popup Modals
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState('FINANCE');
  const [configName, setConfigName] = useState('');
  const [key, setKey] = useState(''); 
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');

  const [visibleSecretKey, setVisibleSecretKey] = useState<string | null>(null);

  const loadSettingsData = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data: metaGroup } = await supabase.from('system_metadata').select('data').eq('name', 'Danh mục Nhóm Cấu hình').maybeSingle();
      setConfigGroups(metaGroup?.data || []);

      const { data: configs, error } = await supabase.from('system_settings').select('*').order('config_name', { ascending: true });
      if (error) {
        setDbError(error.message);
      } else {
        setSettings(configs || []);
      }
    } catch (err: any) {
      setDbError(err?.message || 'Lỗi kết nối mạng đám mây Cloud');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false); setConfigName(''); setKey(''); setValue(''); setDescription('');
    if (configGroups.length > 0) setGroupName(configGroups[0].code);
    setShowModal(true);
  };

  const handleOpenEdit = (cfg: any) => {
    setIsEditing(true); 
    setGroupName(cfg.group_name || 'FINANCE'); 
    setConfigName(cfg.config_name || ''); 
    setKey(cfg.key || ''); 
    setValue(cfg.value || ''); 
    setDescription(cfg.description || '');
    setShowModal(true);
  };

  const handleDeleteConfig = (keyToDelete: string, name: string) => {
    // 🔥 ĐÃ VÁ LỖI: Chuyển đổi confirm hệ thống sang Custom Confirm Dialog bo góc cao cấp
    showConfirm(
      'Xác nhận hủy biến số', 
      `Sếp có chắc chắn muốn xóa vĩnh viễn cấu hình hệ thống [${name}] không? Hành động này có thể ảnh hưởng luồng sinh mã VietQR.`, 
      async () => {
        try {
          const { error } = await supabase.from('system_settings').delete().eq('key', keyToDelete);
          if (error) {
            showToast('Lỗi kết nối', `Không thể gỡ bỏ: ${error.message}`, 'error');
          } else {
            await loadSettingsData();
            showToast('Đã xóa', 'Tham số cấu hình cốt lõi đã được giải phóng khỏi hệ thống.', 'success');
          }
        } catch (e: any) { showToast('Lỗi hệ thống', e.message, 'error'); }
      }
    );
  };

  const handleSaveConfig = async () => {
    if (!configName.trim()) { 
      showToast('Thiếu thông tin', 'Sếp vui lòng điền đầy đủ Tên hiển thị cấu hình!', 'error'); 
      return; 
    }
    
    let finalKey = key;
    if (!isEditing) {
      finalKey = configName
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/__+/g, '_');
        
      if (!finalKey) finalKey = 'CONFIG_' + Date.now();
    }

    const payload = { 
      group_name: groupName, 
      config_name: configName.trim(), 
      key: finalKey, 
      value: value.trim(), 
      description: description.trim() 
    };

    try {
      if (isEditing) {
        const { error } = await supabase.from('system_settings').update(payload).eq('key', finalKey);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('system_settings').insert([payload]);
        if (error) throw error;
      }

      setShowModal(false); 
      await loadSettingsData();
      // 🔥 ĐÃ VÁ: Nổ Toast UI sang xịn mịn
      showToast('Thành công', '✨ Biến cấu hình hệ thống mới đã được đồng bộ hóa thành công!', 'success');
    } catch (catchErr: any) {
      showToast('Lỗi Database', catchErr.message, 'error');
    }
  };

  const handleInlineValueChange = (targetKey: string, newValue: string) => {
    setSettings(prev => prev.map(s => s.key === targetKey ? { ...s, value: newValue } : s));
  };

  const handleSaveAllInlineChanges = async () => {
    setLoading(true);
    try {
      for (const item of settings) {
        await supabase.from('system_settings').update({ value: item.value }).eq('key', item.key);
      }
      // 🔥 ĐÃ VÁ: Toast thông báo đồng loạt
      showToast('Đã áp dụng', '✨ Đã đồng bộ và cập nhật toàn bộ giá trị chỉnh sửa dòng trực tiếp xuống Database!', 'success');
    } catch (e: any) {
      showToast('Thất bại', e.message, 'error');
    } finally {
      loadSettingsData();
    }
  };

  const getGroupLabel = (code: string) => {
    const matched = configGroups.find(g => (g.code || '').toUpperCase().trim() === (code || '').toUpperCase().trim());
    return matched ? matched.label : `📁 Phân hệ (${code})`;
  };

  const filteredSettings = settings.filter(s => {
    const matchGroup = selectedGroupFilter === 'ALL' || (s.group_name || '').toUpperCase().trim() === selectedGroupFilter.toUpperCase().trim();
    const matchText = !searchTerm.trim() || 
      (s.config_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.value || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchGroup && matchText;
  });

  const totalPages = Math.ceil(filteredSettings.length / itemsPerPage) || 1;
  const paginatedSettings = filteredSettings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen font-sans">
      
      {/* HEADER TỔNG */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-500" />
          <div>
            <h1 className="text-base font-bold">Cấu Hình Biến Hệ Thống Cốt Lõi</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Quản lý các tham số, token bảo mật, tài khoản ngân hàng VietQR trung tâm</p>
          </div>
        </div>
        <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-lg">
          <Plus className="w-4 h-4" /> Tạo Biến Mới
        </button>
      </div>

      {dbError && <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-400 font-mono">⚠️ LỖI KẾT NỐI: {dbError}</div>}

      {/* CONTAINER DATA GRID */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Phân hệ lọc:</span>
            <select 
              className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-purple-300 font-black focus:outline-none w-full sm:w-52 cursor-pointer"
              value={selectedGroupFilter}
              onChange={(e) => { setSelectedGroupFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">🌐 Hiển thị tất cả tham số ({settings.length})</option>
              {configGroups.map(g => <option key={g.code} value={g.code}>{g.label}</option>)}
            </select>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhanh tên tham số..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4 w-1/4">Thuộc Phân Nhóm</th>
                <th className="p-4 w-1/4">Tên Hiển Thị Cấu Hình</th>
                <th className="p-4 w-1/4">Giá Trị Cấu Hình (Value)</th>
                <th className="p-4 w-1/4">Mô Tả Hướng Dẫn</th>
                <th className="p-4 text-center w-24">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px] font-medium">
              {paginatedSettings.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-mono italic">Không tìm thấy bản ghi cấu hình hệ thống nào tương ứng mốc lọc.</td></tr>
              ) : (
                paginatedSettings.map((cfg) => {
                  const isSecret = (cfg.key || '').toLowerCase().includes('pass') || (cfg.key || '').toLowerCase().includes('token');
                  const isSecretVisible = visibleSecretKey === cfg.key;
                  return (
                    <tr key={cfg.key} className="hover:bg-slate-950/20 transition">
                      <td className="p-4"><span className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-purple-400 font-bold block w-fit text-[10px]">{getGroupLabel(cfg.group_name)}</span></td>
                      <td className="p-4"><p className="font-bold text-slate-200 text-xs">{cfg.config_name}</p><span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1 py-0.5 border border-slate-850 rounded mt-1 block w-fit">{cfg.key}</span></td>
                      <td className="p-4">
                        <div className="relative">
                          <input 
                            type={isSecret && !isSecretVisible ? 'password' : 'text'}
                            className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono font-semibold focus:outline-none transition text-xs ${isSecret ? 'text-amber-400 tracking-wider' : 'text-slate-300'}`}
                            value={cfg.value || ''}
                            onChange={(e) => handleInlineValueChange(cfg.key, e.target.value)}
                          />
                          {isSecret && (
                            <button
                              type="button"
                              onClick={() => setVisibleSecretKey(isSecretVisible ? null : cfg.key)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                            >
                              {isSecretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 italic leading-relaxed">{cfg.description || 'Chưa thiết lập ghi chú hướng dẫn.'}</td>
                      <td className="p-4 text-center space-x-1 font-sans">
                        <button onClick={() => handleOpenEdit(cfg)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-blue-400 hover:bg-slate-800 transition" title="Sửa chi tiết"><Sliders className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteConfig(cfg.key, cfg.config_name)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-red-400 hover:bg-red-950/20 transition" title="Xóa vĩnh viễn"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* THANH PHÂN TRANG */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-400 select-none">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <button onClick={handleSaveAllInlineChanges} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition text-[11px] font-sans shadow-md">
              <Save className="w-3.5 h-3.5" /> Lưu dòng chỉnh sửa
            </button>
            <div>Total <span className="text-emerald-400 font-bold">{filteredSettings.length}</span> items</div>
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-4 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span>Show rows:</span>
              <select 
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 focus:outline-none cursor-pointer font-bold text-slate-200"
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronsLeft className="w-4 h-4 text-slate-300" /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronLeft className="w-4 h-4 text-slate-300" /></button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-7 h-7 rounded-lg font-black transition text-[11px] ${currentPage === page ? 'bg-red-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'}`}>{page}</button>
              ))}

              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronRight className="w-4 h-4 text-slate-300" /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronsRight className="w-4 h-4 text-slate-300" /></button>
            </div>

            <div className="flex items-center gap-1.5">
              <input type="number" min={1} max={totalPages} className="w-12 bg-slate-900 border border-slate-800 rounded-lg p-1 text-center font-bold text-slate-100" value={pageInput} onChange={(e) => setPageInput(e.target.value)} />
              <button onClick={() => { const p = Number(pageInput); if (p >= 1 && p <= totalPages) setCurrentPage(p); }} className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg font-black hover:bg-slate-800 text-slate-200 transition">Go</button>
            </div>
          </div>
        </div>

      </div>

      {/* POPUP THÊM MỚI / SỬA ĐỔI BIẾN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 text-xs shadow-2xl relative text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="font-bold uppercase text-blue-500 tracking-wide text-[11px]">{isEditing ? '📝 Sửa cấu hình hệ thống' : '✨ Thêm cấu hình hệ thống mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 font-bold block">Thuộc phân hệ nhóm:</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 text-cyan-400 font-bold focus:outline-none cursor-pointer" value={groupName} onChange={(e) => setGroupName(e.target.value)}>
                  {configGroups.map((g: any) => <option key={g.code} value={g.code}>📁 {g.label}</option>)}
                </select>
              </div>
              <div><label className="text-slate-400 font-bold">Tên hiển thị cấu hình:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 focus:outline-none text-slate-100 font-semibold text-xs" placeholder="Ví dụ: Số tài khoản nộp vốn" value={configName} onChange={(e) => setConfigName(e.target.value)} /></div>
              <div><label className="text-slate-400 font-bold">Giá trị tham số (Value):</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 font-mono focus:outline-none text-amber-400 font-bold text-xs" placeholder="Nhập tham số..." value={value} onChange={(e) => setValue(e.target.value)} /></div>
              <div><label className="text-slate-400 font-bold">Mô tả hướng dẫn:</label><textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 h-16 resize-none focus:outline-none text-slate-300 font-medium leading-relaxed" placeholder="Ghi chú hướng dẫn..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-950 border border-slate-800 p-3 rounded-xl font-bold text-slate-400 text-center transition hover:bg-slate-850">Hủy</button>
              <button type="button" onClick={handleSaveConfig} className="flex-1 bg-blue-600 text-white font-black p-3 rounded-xl shadow-lg">Lưu tham số</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
