export default function Loading() {
  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce">
          <img src="/images/logo.png" alt="Toolate" loading="eager" fetchPriority="high" className="w-10 h-10 object-contain" />
        </div>
        <div className="mt-4 flex space-x-1">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500 tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );
}
