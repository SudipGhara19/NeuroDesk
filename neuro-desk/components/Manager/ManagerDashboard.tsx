'use client';

export default function ManagerDashboard() {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Management Hub</h2>
      <p className="text-gray-600">Track team performance, project timelines, and resource allocation.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 bg-primary/5 rounded-xl border border-primary/10">
          <h3 className="font-bold text-primary-darkest mb-2">Active Projects</h3>
          <ul className="space-y-2">
            <li className="flex justify-between text-primary-darker text-sm">
              <span>Neuro-Core API</span>
              <span className="font-bold">85%</span>
            </li>
            <li className="flex justify-between text-primary-darker text-sm">
              <span>Frontend Refactor</span>
              <span className="font-bold">40%</span>
            </li>
          </ul>
        </div>
        <div className="p-6 bg-primary-dark/5 rounded-xl border border-primary-dark/10">
          <h3 className="font-bold text-primary-darkest mb-2">Team Capacity</h3>
          <div className="h-4 w-full bg-primary-dark/20 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-primary-dark w-3/4" />
          </div>
          <p className="text-xs text-primary-darker mt-2 font-medium">75% Utilization across 12 members</p>
        </div>
      </div>
    </div>
  );
}
