"use client";

export default function DigestErrorCard() {
  return (
    <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-zinc-900 font-medium mb-1">今日摘要載入失敗</p>
      <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed mb-1">
        連線或資料抓取發生問題——這不是因為今天還沒更新。請稍後重試。
      </p>
      <p className="text-xs text-red-400 tech-mono mb-5 whitespace-nowrap">ERR · fetch /digest/today failed</p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356m-.001 5.586a8.25 8.25 0 10-2.39 5.418" />
        </svg>
        重新載入
      </button>
    </div>
  );
}
