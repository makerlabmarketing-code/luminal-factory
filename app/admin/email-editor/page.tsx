// app/admin/email-editor/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Save, Sparkles, RefreshCcw, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function AdvancedEmailTemplateEditor() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States cho Popup
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);

  // Form States
  const [groupType, setGroupType] = useState('CUSTOMER_THANKS');
  const [templateName, setTemplateName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');

  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await supabase.from('email_templates').select('*').order('id', { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  };

  useEffect(() => { loadTemplates(); }, []);

  const handleOpenAdd = () => {
    setIsEditing(false); setTargetId(null); setGroupType('CUSTOMER_THANKS'); setTemplateName(''); setSubject(''); setHtmlContent('');
    setShowModal(true);
  };

  const handleOpenEdit = (tpl: any) => {
    setIsEditing(true); setTargetId(tpl.id); setGroupType(tpl.group_type); setTemplateName(tpl.template_name); setSubject(tpl.subject); setHtmlContent(tpl.html_content);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('⚠️ Sếp có chắc chắn muốn xóa vĩnh viễn mẫu Email này không?')) {
      await supabase.from('email_templates').delete().eq('id', id);
      loadTemplates();
    }
  };

  const handleSave = async () => {
    if (!templateName || !subject) { alert('Vui lòng điền đủ Tên mẫu và Tiêu đề!'); return; }
    const payload = { group_type: groupType, template_name: templateName, subject, html_content: htmlContent };
    
    if (isEditing && targetId) {
      await supabase.from('email_templates').update(payload).eq('id', targetId);
    } else {
      await supabase.from('email_templates').insert([payload]);
    }
    setShowModal(false); loadTemplates(); alert('Đã lưu Kịch bản Email!');
  };

  if (loading) return <div className="p-6 text-xs text-center font-mono text-slate-500"><RefreshCcw className="w-4 h-4 animate-spin inline" /> Đang tải dữ liệu mail...</div>;

  return (
    <div className="p-6 space-y-6 text-slate-100 bg-slate-950 min-h-screen font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-500" /> Hệ Thống Kịch Bản Email Tự Động</h1>
          <p className="text-[11px] text-slate-400 mt-1">Danh sách các mẫu thư gửi khách hàng, gọi vốn và báo lương</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition"><Plus className="w-4 h-4" /> Tạo Mẫu Mới</button>
      </div>

      {/* BẢNG QUẢN LÝ TEMPLATE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
            <tr><th className="p-4">Mã Nhóm (Type)</th><th className="p-4">Tên Mẫu Email</th><th className="p-4">Tiêu đề (Subject)</th><th className="p-4 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {templates.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-mono">Chưa có mẫu Email nào.</td></tr> : templates.map(tpl => (
              <tr key={tpl.id} className="hover:bg-slate-950/40 transition">
                <td className="p-4 font-mono font-bold text-emerald-400">{tpl.group_type}</td>
                <td className="p-4 font-bold text-slate-200">{tpl.template_name}</td>
                <td className="p-4 text-slate-400 truncate max-w-xs">{tpl.subject}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleOpenEdit(tpl)} className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(tpl.id)} className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POPUP THÊM/SỬA TEMPLATE (CÓ LIVE PREVIEW) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-5xl h-[85vh] flex flex-col space-y-4">
            <div className="flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-200 uppercase">{isEditing ? 'Cập Nhật Mẫu Email' : 'Soạn Thảo Mẫu Email Mới'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-500 hover:text-white" /></button>
            </div>
            
            <div className="flex-1 flex gap-4 min-h-0">
              {/* Cột trái: Form Nhập */}
              <div className="w-1/2 flex flex-col space-y-3 overflow-y-auto pr-2 text-xs">
                <div><label className="text-slate-400 font-bold">Mã Nhóm (Loại Mail):</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none font-mono text-emerald-400 uppercase" placeholder="VD: CAPITAL_CALL, CUSTOMER_THANKS..." value={groupType} onChange={(e) => setGroupType(e.target.value.toUpperCase())} /></div>
                <div><label className="text-slate-400 font-bold">Tên gợi nhớ:</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none text-slate-200" placeholder="VD: Mail thông báo nộp tiền..." value={templateName} onChange={(e) => setTemplateName(e.target.value)} /></div>
                <div><label className="text-slate-400 font-bold">Tiêu đề (Subject):</label><input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 mt-1 focus:outline-none text-slate-200" placeholder="VD: Luminal HQ - Yêu cầu..." value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
                <div className="flex-1 flex flex-col min-h-[200px]">
                  <label className="text-slate-400 font-bold mb-1">Mã HTML (Hỗ trợ biến: {"{{hoTen}}"}, {"{{soTien}}"}):</label>
                  <textarea className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 resize-none focus:outline-none" value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} spellCheck={false} />
                </div>
              </div>
              
              {/* Cột phải: Live Preview */}
              <div className="w-1/2 bg-slate-950 border border-slate-800 rounded-2xl p-2 flex flex-col items-center">
                <div className="text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-wider">Live Preview</div>
                <iframe className="w-full flex-1 bg-white rounded-xl shadow-inner border-none" srcDoc={htmlContent} />
              </div>
            </div>

            <div className="shrink-0 pt-2 border-t border-slate-800">
              <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-xl uppercase tracking-wider transition"><Save className="w-4 h-4 inline mr-1.5" /> {isEditing ? 'Lưu Thay Đổi' : 'Tạo Mới Kịch Bản'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}