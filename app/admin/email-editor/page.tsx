'use client';
import { useState } from 'react';
import { Code, Eye, Save, Sparkles } from 'lucide-react';

export default function EmailLiveEditorPage() {
  const [htmlCode, setHtmlCode] = useState(`<html>
<body style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 20px;">
  <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <div style="background: #2563eb; color: #ffffff; padding: 20px; text-align: center;">
      <h2 style="margin: 0;">LUMINAL FACTORY</h2>
      <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 12px;">Phiếu Chi Trả Lương - Tháng {{thang}}</p>
    </div>
    <div style="padding: 20px; color: #1e293b;">
      <p>Thân gửi: <b>{{hoTen}}</b></p>
      <p>Số tiền thực nhận: <b style="color: #dc2626; font-size: 16px;">{{tongTien}} đ</b></p>
    </div>
  </div>
</body>
</html>`);

  const processLivePreview = () => {
    let mockHtml = htmlCode;
    mockHtml = mockHtml.replace(
      /{{thang}}/g,
      (new Date().getMonth() + 1).toString()
    );
    mockHtml = mockHtml.replace(/{{hoTen}}/g, 'Nguyễn Yến Nhi');
    mockHtml = mockHtml.replace(/{{tongTien}}/g, '1.620.000');
    return mockHtml;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="flex justify-between items-center px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h1 className="text-sm font-bold uppercase">
            Live Email Layout Studio
          </h1>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition">
          <Save className="w-3.5 h-3.5" /> Lưu Mẫu Email
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 h-full flex flex-col border-r border-slate-800">
          <textarea
            className="flex-1 w-full bg-slate-950 text-slate-300 p-4 font-mono text-xs focus:outline-none resize-none leading-relaxed"
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="w-1/2 h-full flex flex-col bg-slate-900 p-4 justify-center items-center">
          <iframe
            title="Live Render"
            className="w-full h-full max-w-[450px] bg-slate-900 rounded-xl border border-slate-800"
            srcDoc={processLivePreview()}
          />
        </div>
      </div>
    </div>
  );
}
