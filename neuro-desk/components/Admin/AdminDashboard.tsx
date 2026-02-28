'use client';

export default function AdminDashboard() {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Console</h2>
      <p className="text-gray-600">Overview of system health, user activity, and critical metrics.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Total Users</p>
          <p className="text-3xl font-bold text-primary-darkest mt-1">1,284</p>
        </div>
        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
          <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Active Sessions</p>
          <p className="text-3xl font-bold text-green-900 mt-1">42</p>
        </div>
        <div className="p-4 bg-primary-dark/5 rounded-xl border border-primary-dark/10">
          <p className="text-sm font-medium text-primary-dark uppercase tracking-wider">System Status</p>
          <p className="text-3xl font-bold text-primary-darkest mt-1">Optimal</p>
        </div>
      </div>
    </div>
  );
}
