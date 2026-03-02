'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { UserRecord } from '@/lib/features/users/usersSlice';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AggregateChartsProps {
  users: UserRecord[];
  theme: string;
}

export default function AggregateCharts({ users, theme }: AggregateChartsProps) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  
  // Queries Bar Colors
  const queryColor = isDark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.8)'; // blue
  const queryHover = isDark ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)';
  
  // Cost Bar Colors
  const costColor = isDark ? 'rgba(16, 185, 129, 0.8)' : 'rgba(5, 150, 105, 0.8)'; // green
  const costHover = isDark ? 'rgba(16, 185, 129, 1)' : 'rgba(5, 150, 105, 1)';

  const topByQueries = useMemo(() => {
    return [...users]
      .filter((u) => (u.stats?.totalQueries || 0) > 0)
      .sort((a, b) => (b.stats?.totalQueries || 0) - (a.stats?.totalQueries || 0))
      .slice(0, 5);
  }, [users]);

  const topByCost = useMemo(() => {
    return [...users]
      .filter((u) => (u.stats?.totalCostEstimate || 0) > 0)
      .sort((a, b) => (b.stats?.totalCostEstimate || 0) - (a.stats?.totalCostEstimate || 0))
      .slice(0, 5);
  }, [users]);

  // Aggregate Queries
  const aggregateQueries = useMemo(() => {
    let daily = 0, weekly = 0, monthly = 0;
    users.forEach(u => {
      daily += u.analytics?.queryFrequency?.daily || 0;
      weekly += u.analytics?.queryFrequency?.weekly || 0;
      monthly += u.analytics?.queryFrequency?.monthly || 0;
    });
    return { daily, weekly, monthly };
  }, [users]);

  // Role Distribution
  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = { Admin: 0, Manager: 0, User: 0 };
    users.forEach(u => {
      if (counts[u.role] !== undefined) counts[u.role]++;
      else counts[u.role] = 1;
    });
    // Only return roles that have > 0 users
    return Object.entries(counts).filter(([, count]) => count > 0);
  }, [users]);

  const queryData = {
    labels: topByQueries.map(u => u.fullName),
    datasets: [{
      label: 'Total Queries',
      data: topByQueries.map(u => u.stats?.totalQueries || 0),
      backgroundColor: queryColor,
      hoverBackgroundColor: queryHover,
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.8,
    }]
  };

  const costData = {
    labels: topByCost.map(u => u.fullName),
    datasets: [{
      label: 'Estimated Cost ($)',
      data: topByCost.map(u => u.stats?.totalCostEstimate || 0),
      backgroundColor: costColor,
      hoverBackgroundColor: costHover,
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.8,
    }]
  };

  const aggregateQueryData = {
    labels: ['Daily', 'Weekly', 'Monthly'],
    datasets: [{
      label: 'System Queries',
      data: [aggregateQueries.daily, aggregateQueries.weekly, aggregateQueries.monthly],
      backgroundColor: isDark ? 'rgba(168, 85, 247, 0.8)' : 'rgba(147, 51, 234, 0.8)', // purple
      hoverBackgroundColor: isDark ? 'rgba(168, 85, 247, 1)' : 'rgba(147, 51, 234, 1)',
      borderRadius: 4,
      barPercentage: 0.6,
      categoryPercentage: 0.8,
    }]
  };

  const roleColors = isDark 
    ? ['rgba(168, 85, 247, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(156, 163, 175, 0.8)']
    : ['rgba(147, 51, 234, 0.8)', 'rgba(37, 99, 235, 0.8)', 'rgba(107, 114, 128, 0.8)'];

  const roleData = {
    labels: roleDistribution.map(([role]) => role),
    datasets: [{
      data: roleDistribution.map(([, count]) => count),
      backgroundColor: roleColors.slice(0, roleDistribution.length),
      borderWidth: 0,
      hoverOffset: 4,
    }]
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getOptions = (formatCallback?: (val: any) => string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#ffffff' : '#000000',
        bodyColor: isDark ? '#d1d5db' : '#374151',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callbacks: formatCallback ? { label: (ctx: any) => formatCallback(ctx.parsed.y) } : {}
      },
    },
    scales: {
      y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, font: { size: 11 } } },
      x: { grid: { display: false, drawBorder: false }, ticks: { color: textColor, font: { size: 11 } } },
    }
  });

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: textColor,
          font: { size: 12 },
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: getOptions().plugins.tooltip,
    },
    cutout: '70%',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div className={`p-4 sm:p-6 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
        <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Top Users by Activity
        </h3>
        {topByQueries.length > 0 ? (
          <div className="h-64">
            <Bar data={queryData} options={getOptions((v) => `${v} queries`)} />
          </div>
        ) : (
          <div className={`h-64 flex items-center justify-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No query data available yet.
          </div>
        )}
      </div>

      <div className={`p-4 sm:p-6 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
        <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Highest Cost Consumers
        </h3>
        {topByCost.length > 0 ? (
          <div className="h-64">
            <Bar data={costData} options={getOptions((v) => `$${Number(v).toFixed(2)}`)} />
          </div>
        ) : (
          <div className={`h-64 flex items-center justify-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No cost data available yet.
          </div>
        )}
      </div>

      <div className={`p-4 sm:p-6 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
        <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          System Query Volume
        </h3>
        {aggregateQueries.daily > 0 || aggregateQueries.weekly > 0 || aggregateQueries.monthly > 0 ? (
          <div className="h-64">
            <Bar data={aggregateQueryData} options={getOptions((v) => `${v} queries`)} />
          </div>
        ) : (
          <div className={`h-64 flex items-center justify-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No system query data available.
          </div>
        )}
      </div>

      <div className={`p-4 sm:p-6 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
        <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Role Distribution
        </h3>
        {roleDistribution.length > 0 ? (
          <div className="h-64 pb-4">
            <Doughnut data={roleData} options={doughnutOptions} />
          </div>
        ) : (
          <div className={`h-64 flex items-center justify-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No role data available.
          </div>
        )}
      </div>
    </div>
  );
}
