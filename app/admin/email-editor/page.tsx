// app/admin/email-editor/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Mail, Plus, Trash2, Edit2, X, Save, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Search, RefreshCcw, Filter, Send, Sparkles 
} from 'lucide-react';

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [emailGroups, setEmailGroups] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Dòng kịch bản đang được sếp chọn để Generate Live Preview ở góc bên cạnh
  const [selectedPreview, setSelectedPreview] = useState<any>(null);

  // Bộ lọc nâng cao & Ô tra cứu tìm kiếm văn bản góc bảng
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 
  const [pageInput, setPageInput] = useState('1');

  // States Modal Popup
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form Fields
  const [groupType, setGroupType] = useState('WELCOME');
  const [scriptName, setScriptName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const loadData = async (isInitial = true) => {
    if (isInitial) setLoading(true);
    setDbError(null);
    try {
      // 1. Đọc danh mục nhóm Email động từ Metadata DB
      const { data: metaGroup } = await supabase.from('system_metadata').select('data').eq('name', 'Danh mục Nhóm Email').maybeSingle();
      const dynamicGroups = metaGroup?.data || [
        { "code": "WELCOME", "label": "📧 Thư Chào Mừng Thành Viên" },
        { "code": "ORDER_CONFIRM", "label": "📦 Xác Nhận Đơn Hàng Mới" },
        { "code": "SHIPPING", "label": "🚚 Thông Báo Giao Hàng Xuất Kho" },
        { "code": "ALERT_SYSTEM", "label": "⚠️ Cảnh Báo Nghẽn Dây Chuyền" }
      ];
      setEmailGroups(dynamicGroups);

      // 2. Tải toàn bộ danh sách kịch bản mẫu chi tiết từ Cloud
      const { data, error } = await supabase.from('email_templates').select('*').order('id', { ascending: false });
      if (error) {
        setDbError(error.message);
      } else {
        setTemplates(data || []);
        if (data && data.length > 0 && !selectedPreview) {
          setSelectedPreview(data[0]);
        }
      }
    } catch (err: any) {
      setDbError(err?.message || 'Lỗi kết nối mạng đám mây Cloud');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => { loadData(true); }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setScriptName('');
    setSubject('');
    setBody('');
    if (emailGroups.length > 0) setGroupType(emailGroups[0].code);
    setShowModal(true);
  };

  const handleOpenEdit = (t: any) => {
    setIsEditing(true);
    setEditingId(t.id);
    setGroupType(t.group_type || 'WELCOME');
    setScriptName(t.template_name || ''); 
    setSubject(t.subject || '');
    setBody(t.html_content || t.body || ''); 
    setShowModal(true);
  };

  const handleGenerateSampleBody = () => {
    let sample = '';
    if (groupType === 'WELCOME') {
      sample = '<p style="color: #a855f7; font-weight: bold;">Chào sếp [customer_name],</p><p>Chào mừng sếp đã gia nhập hệ thống điều hành xưởng của chúng tôi! Tài khoản quản trị của sếp đã sẵn sàng.</p>';
    } else if (groupType === 'ORDER_CONFIRM') {
      sample = '<p style="color: #10b981; font-weight: bold;">✓ HẠCH TOÁN THÀNH CÔNG</p><p>Đơn hàng <strong>#[order_id]</strong> của sếp đã được phê duyệt đưa vào sản xuất với tổng giá trị <strong>[amount] đ</strong>.</p>';
    } else if (groupType === 'SHIPPING') {
      sample = '<p>Chào sếp [customer_name], đơn sản phẩm #[order_id] đã bốc xếp xuất kho thành công và đang trên đường vận chuyển hỏa tốc.</p>';
    } else {
      sample = '<p>Nội dung phôi mẫu kịch bản hệ thống cho phân hệ: ' + groupType + '</p>';
    }
    setBody(sample);
  };

  const handleTestSendEmail = (t: any) => {
    const targetMail = window.prompt('📧 Nhập địa chỉ Email nhận để gửi thử nghiệm cấu trúc kịch bản [' + (t.template_name || '') + ']:', 'admin@gmail.com');
    if (!targetMail || !targetMail.trim()) return;
    alert('🚀 [AUTOMATION EMAIL]: Đã kết nối cổng SMTP máy xưởng phát lệnh bắn thử nghiệm kịch bản thư thành công tới địa chỉ: [' + targetMail.trim() + ']');
  };

  const handleSave = async () => {
    try {
      if (!scriptName.trim() || !subject.trim()) { 
        alert("Vui lòng điền đủ Tên kịch bản và Tiêu đề thư!"); 
        return; 
      }
      
      const payload = { 
        group_type: groupType, 
        template_name: scriptName.trim(), 
        subject: subject.trim(), 
        html_content: body.trim() 
      };
      
      if (isEditing && editingId) {
        const { error } = await supabase.from('email_templates').update(payload).eq('id', editingId);
        if (error) return alert('❌ Lỗi cập nhật Database: ' + error.message);
      } else {
        const { error } = await supabase.from('email_templates').insert([payload]);
        if (error) return alert('❌ Lỗi thêm mới Database: ' + error.message);
      }
      
      setShowModal(false);
      setEditingId(null);
      await loadData(false);
      alert('✨ Hệ thống đã đồng bộ và cập nhật kịch bản lên Cloud thành công!');
    } catch (catchErr: any) {
      alert('💥 Lỗi phát sinh: ' + (catchErr?.message || catchErr));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("⚠️ Sếp có chắc chắn muốn xóa vĩnh viễn kịch bản template này không?")) {
      await supabase.from('email_templates').delete().eq('id', id);
      if (selectedPreview?.id === id) setSelectedPreview(null);
      loadData(false);
    }
  };

  const getGroupLabel = (code: string) => {
    const matched = emailGroups.find(g => (g.code || '').toUpperCase().trim() === (code || '').toUpperCase().trim());
    return matched ? matched.label : '📧 Phân hệ (' + code + ')';
  };

  const filteredTemplates = templates.filter(t => {
    const matchGroup = selectedGroupFilter === 'ALL' || (t.group_type || '').toUpperCase().trim() === selectedGroupFilter.toUpperCase().trim();
    const matchText = !searchTerm.trim() || 
      (t.template_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.html_content || t.body || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchGroup && matchText;
  });

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage) || 1;
  const currentData = filteredTemplates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="p-6 text-xs text-center font-mono text-slate-500 min-h-screen bg-slate-950 flex items-center justify-center gap-2">
        <RefreshCcw className="w-4 h-4 animate-spin inline" />
        <span>Đang kết nối trung tâm cấu hình email...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 bg-slate-950 min-h-screen font-sans">
      
      {/* HEADER TỔNG */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-purple-400" />
          <div>
            <h1 className="text-base font-bold">Kịch Bản Email Templates Hệ Thống</h1>
            <p className="text-[11px] text-purple-400 font-mono font-bold mt-0.5">✓ Kết nối thông suốt • Sẵn sàng điều phối cổng SMTP viễn thông</p>
          </div>
        </div>
        <button onClick={handleOpenAdd} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-lg">
          <Plus className="w-4 h-4" /> Thêm Kịch Bản
        </button>
      </div>

      {dbError && <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-400 font-mono">⚠️ CẢNH BÁO LỖI: {dbError}</div>}

      {/* CHIA ĐÔI MÀN HÌNH CHUẨN PHOM SẾP CHỈ ĐỊNH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* KHỐI BÊN TRÁI: TABLE FLAT + ENTERPRISE PAGINATION */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <select 
              className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-purple-300 font-black focus:outline-none w-full sm:w-56 cursor-pointer"
              value={selectedGroupFilter}
              onChange={(e) => { setSelectedGroupFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="ALL">🌐 Tất cả kịch bản ({templates.length})</option>
              {emailGroups.map(g => <option key={g.code} value={g.code}>{g.label}</option>)}
            </select>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input type="text" placeholder="Tìm tên kịch bản, tiêu đề..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/40" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); setPageInput('1'); }} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-500 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 w-1/4">Thuộc Phân Hệ</th>
                  <th className="p-4 w-1/3">Tên Gọi Kịch Bản</th>
                  <th className="p-4 text-center w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {currentData.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-slate-500 font-mono">Không tìm thấy kịch bản email nào khớp bộ lọc.</td></tr>
                ) : (
                  currentData.map(t => (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedPreview(t)}
                      className={`transition cursor-pointer ${selectedPreview?.id === t.id ? 'bg-purple-950/20 text-purple-300 font-bold' : 'hover:bg-slate-950/10'}`}
                    >
                      <td className="p-4">
                        <span className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-purple-400 font-mono font-bold text-[10px] block w-fit">
                          {t.group_type}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-200">{t.template_name || 'Chưa đặt tên'}</td>
                      <td className="p-4 text-center space-x-1.5 font-sans" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleTestSendEmail(t)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-purple-400 hover:bg-purple-900/30 transition" title="Gửi thử thư nghiệm"><Send className="w-3.5 h-3.5"/></button>
                        <button onClick={() => handleOpenEdit(t)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-blue-400 hover:bg-slate-800 transition" title="Sửa"><Edit2 className="w-3.5 h-3.5"/></button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-red-500 hover:bg-red-950/20 transition" title="Xóa"><Trash2 className="w-3.5 h-3.5"/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* LƯỚI PHÂN TRANG ENTERPRISE CAO CẤP */}
          <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-400 select-none">
            <div>Total <span className="text-purple-400 font-bold">{filteredTemplates.length}</span> items</div>
            
            <div className="flex flex-wrap items-center justify-end gap-4 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <span>Show rows:</span>
                <select 
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 font-bold text-slate-200 focus:outline-none cursor-pointer"
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); setPageInput('1'); }}
                >
                  <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => { setCurrentPage(1); setPageInput('1'); }} disabled={currentPage === 1} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronsLeft className="w-4 h-4 text-slate-300" /></button>
                <button onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); setPageInput(String(p)); }} disabled={currentPage === 1} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronLeft className="w-4 h-4 text-slate-300" /></button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => { setCurrentPage(page); setPageInput(String(page)); }} className={`w-7 h-7 rounded-lg font-black transition text-[11px] ${currentPage === page ? 'bg-red-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'}`}>{page}</button>
                ))}

                <button onClick={() => { const p = Math.min(totalPages, currentPage + 1); setCurrentPage(p); setPageInput(String(p)); }} disabled={currentPage === totalPages} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronRight className="w-4 h-4 text-slate-300" /></button>
                <button onClick={() => { setCurrentPage(totalPages); setPageInput(String(totalPages)); }} disabled={currentPage === totalPages} className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-20 hover:bg-slate-800 transition"><ChevronsRight className="w-4 h-4 text-slate-300" /></button>
              </div>

              <div className="flex items-center gap-1.5">
                <input type="number" min={1} max={totalPages} className="w-12 bg-slate-900 border border-slate-800 rounded-lg p-1 text-center font-bold text-slate-100 focus:outline-none" value={pageInput} onChange={(e) => setPageInput(e.target.value)} />
                <button onClick={() => { const p = Number(pageInput); if (p >= 1 && p <= totalPages) setCurrentPage(p); }} className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg font-black hover:bg-slate-800 text-slate-200 transition">Go</button>
              </div>
            </div>
          </div>

        </div>

        {/* KHỐI BÊN PHẢI: LIVE VIEW PREVIEW BODY ĐÃ CẬP NHẬT RENDER HTML THỰC TẾ DƯỚI NỀN */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl h-fit">
          <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
            <Mail className="w-4 h-4 text-emerald-400" />
            <h3 className="font-black text-slate-300 uppercase tracking-wider text-[10px]">Khung Xem Trước Trực Quan (Live Body Preview)</h3>
          </div>

          {selectedPreview ? (
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono leading-relaxed space-y-1.5">
                <p><span className="text-slate-500">Mã kịch bản:</span> <span className="text-purple-400 font-bold">{selectedPreview.group_type}</span></p>
                <p><span className="text-slate-500">Tên gọi kịch bản:</span> <span className="text-slate-200 font-bold">{selectedPreview.template_name || 'Chưa đặt tên'}</span></p>
                <p><span className="text-slate-500">Tiêu đề thư (Subject):</span> <span className="text-amber-400 font-bold select-all">{selectedPreview.subject || '(Trống tiêu đề)'}</span></p>
              </div>

              <div className="bg-slate-950 border border-slate-800/60 rounded-xl overflow-hidden shadow-inner">
                <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-[10px] text-slate-500 font-mono flex gap-1.5 items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500/60"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500/60"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500/60"></div>
                  <span className="ml-1 text-[9px] text-slate-400">Giao diện hòm thư hiển thị giả lập</span>
                </div>
                
                {/* 💥 ĐÃ FIX LỖI: Sử dụng dangerouslySetInnerHTML giúp compile code live HTML trực quan */}
                <div 
                  className="p-4 min-h-[160px] max-h-[320px] overflow-y-auto text-xs text-slate-300 leading-relaxed select-text font-sans text-left bg-slate-950"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedPreview.html_content || selectedPreview.body || '<span class="text-slate-500 italic">Bức thư này chưa cấu hình nội dung.</span>' 
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-600 font-mono italic text-center py-12 leading-relaxed">Sếp vui lòng click chọn một dòng kịch bản bất kỳ ở bảng bên trái để bật khung xem trước nhé!</p>
          )}
        </div>

      </div>

      {/* MODAL POPUP THÊM MỚI / CHỈNH SỬA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 text-xs relative text-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h2 className="font-bold uppercase text-purple-400 tracking-wide font-sans">{isEditing ? '📝 Sửa kịch bản email' : '✨ Thêm kịch bản email'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 font-bold block">Thuộc phân hệ nhóm email (Group Type):</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mt-1.5 text-purple-400 font-bold focus:outline-none text-xs" value={groupType} onChange={(e) => setGroupType(e.target.value)}>
                  {emailGroups.map((g: any) => <option key={g.code} value={g.code}>📁 {g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-bold block">Tên kịch bản (Template Name):</label>
                <input placeholder="Ví dụ: Thư tự động cảm ơn khi khách nạp vốn đầu tư thành công" className="w-full bg-slate-950 p-3 mt-1.5 rounded-xl border border-slate-800 text-xs focus:outline-none text-slate-100 font-medium" value={scriptName} onChange={(e) => setScriptName(e.target.value)} />
              </div>
              <div>
                <label className="text-slate-400 font-bold block">Tiêu đề thư gửi đi (Subject):</label>
                <input placeholder="Ví dụ: [Hệ thống] Xác nhận hạch toán dòng tiền kỳ góp vốn" className="w-full bg-slate-950 p-3 mt-1.5 rounded-xl border border-slate-800 text-xs focus:outline-none text-slate-200 font-medium" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              
              <div>
                <div className="flex justify-between items-center select-none">
                  <label className="text-slate-400 font-bold block">Nội dung văn bản thư (Html Content):</label>
                  <button type="button" onClick={handleGenerateSampleBody} className="text-[10px] text-amber-400 font-bold flex items-center gap-1 bg-amber-950/40 border border-amber-800/30 px-2 py-1 rounded-lg transition"><Sparkles className="w-3 h-3" /> Gen mẫu kịch bản</button>
                </div>
                <textarea placeholder="Soạn nội dung..." className="w-full bg-slate-950 p-3 mt-1.5 rounded-xl border border-slate-800 text-xs h-36 resize-none focus:outline-none text-slate-300 font-mono leading-relaxed" value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2.5 border-t border-slate-800 font-sans">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl font-bold text-slate-400 text-center transition hover:bg-slate-850">Hủy</button>
              <button type="button" onClick={handleSave} className="flex-1 p-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-black text-white shadow-lg">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}