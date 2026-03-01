export default function SkeletonCard({ theme }: { theme: string }) {
  return (
    <div className={`p-4 rounded-2xl border animate-pulse flex items-center gap-4 ${
      theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'
    }`}>
      <div className={`w-10 h-10 rounded-full shrink-0 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
      <div className="flex-1 space-y-2">
        <div className={`h-3 w-32 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
        <div className={`h-2.5 w-48 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`h-7 w-16 rounded-lg ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
        ))}
      </div>
    </div>
  );
}
