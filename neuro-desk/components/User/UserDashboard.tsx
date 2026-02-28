'use client';

export default function UserDashboard() {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">My Workspace</h2>
      <p className="text-gray-600">Access your tools, recent activity, and personal statistics.</p>
      
      <div className="mt-8 p-8 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-700">No recent activity</h3>
        <p className="text-sm text-gray-500 mt-1">Start by creating a new project or uploading a document.</p>
        <button className="mt-6 px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all">
          New Project
        </button>
      </div>
    </div>
  );
}
