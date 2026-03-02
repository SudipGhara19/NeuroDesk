'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import HealthReportModal from '../modals/analytics/HealthReportModal';
import api from '@/lib/axios';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Format bytes to KB/MB/GB
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function SystemAnalytics() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Analyzer state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportData, setReportData] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/system');
        setData(res.data);
      } catch (err) {
        const fetchError = err as { response?: { data?: { message?: string } } };
        setError(fetchError.response?.data?.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-[60vh] animate-pulse ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-bold tracking-widest uppercase">Aggregating System Data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className={`p-6 rounded-2xl border text-center ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
          <h3 className="text-lg font-bold mb-2">Analytics Error</h3>
          <p className="text-sm">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  // --- Chart Theming ---
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const bgClass = isDark ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-gray-100';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getOptions = (formatCallback?: (val: any) => string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#fff' : '#000',
        bodyColor: isDark ? '#ccc' : '#333',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            const val = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            label += formatCallback ? formatCallback(val) : val;
            return label;
          }
        }
      }
    },
    scales: {
      y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, font: { size: 11 } } },
      x: { grid: { display: false, drawBorder: false }, ticks: { color: textColor, font: { size: 11 } } },
    }
  });

  const handleAnalyzeHealth = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      const res = await api.post('/analytics/system/analyze');
      setReportData(res.data.report);
      setShowReport(true);
    } catch (err) {
      const fetchError = err as { response?: { data?: { message?: string } } };
      alert(fetchError.response?.data?.message || 'Failed to analyze system health');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { color: textColor, font: { size: 12 }, padding: 20, usePointStyle: true }
      },
      tooltip: getOptions().plugins.tooltip,
    },
    cutout: '70%',
  };

  // --- Chart Data Preparation ---
  const roleColors = isDark 
    ? ['rgba(168, 85, 247, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(156, 163, 175, 0.8)']
    : ['rgba(147, 51, 234, 0.8)', 'rgba(37, 99, 235, 0.8)', 'rgba(107, 114, 128, 0.8)'];

  const roleLabels = Object.keys(data.users.byRole);
  const roleData = {
    labels: roleLabels,
    datasets: [{
      data: Object.values(data.users.byRole),
      backgroundColor: roleColors.slice(0, roleLabels.length),
      borderWidth: 0,
    }]
  };

  const docTypeLabels = Object.keys(data.knowledgeBase.byType).map(t => t.toUpperCase());
  const docTypeData = {
    labels: docTypeLabels.length > 0 ? docTypeLabels : ['No Docs'],
    datasets: [{
      data: docTypeLabels.length > 0 ? Object.values(data.knowledgeBase.byType) : [1],
      backgroundColor: isDark 
        ? ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#6b7280']
        : ['#059669', '#2563eb', '#d97706', '#7c3aed', '#9ca3af'],
      borderWidth: 0,
    }]
  };

  const queryFreqData = {
    labels: ['Daily', 'Weekly', 'Monthly'],
    datasets: [{
      label: 'System Queries',
      data: [data.aiUsage.queryFrequency.daily, data.aiUsage.queryFrequency.weekly, data.aiUsage.queryFrequency.monthly],
      backgroundColor: isDark ? 'rgba(168, 85, 247, 0.8)' : 'rgba(147, 51, 234, 0.8)',
      borderRadius: 4,
    }]
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. TOP LEVEL KPI STRIP & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <h2 className={`text-sm font-black uppercase tracking-widest pl-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Platform Highlights
        </h2>
        
        <button
          onClick={handleAnalyzeHealth}
          disabled={isAnalyzing}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            isAnalyzing 
              ? (isDark ? 'bg-purple-900/50 text-purple-400 cursor-not-allowed' : 'bg-purple-100 text-purple-400 cursor-not-allowed')
              : 'bg-purple-600 hover:bg-purple-500 text-white hover:-translate-y-0.5 shadow-purple-500/20'
          }`}
        >
          {isAnalyzing ? (
             <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>✨</span>
          )}
          {isAnalyzing ? 'Analyzing System...' : 'Analyze System Health'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: data.users.total, sub: `${data.users.active} Active`, color: 'text-blue-500' },
          { label: 'Total Queries', value: data.aiUsage.totalQueries.toLocaleString(), sub: 'Across all models', color: 'text-purple-500' },
          { label: 'Total AI Cost', value: `$${Number(data.aiUsage.totalCostEstimate).toFixed(2)}`, sub: `${data.aiUsage.totalTokens.toLocaleString()} Tokens`, color: 'text-green-500' },
          { label: 'Storage Used', value: formatBytes(data.knowledgeBase.totalStorageBytes), sub: `${data.knowledgeBase.totalDocuments} Documents`, color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${bgClass}`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</p>
            <p className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</p>
            <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* 2. CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
        
        {/* User Role Distribution */}
        <div className={`p-6 rounded-2xl border flex flex-col ${bgClass}`}>
          <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Role Distribution
          </h3>
          <div className="flex-1 min-h-[250px] relative">
            <Doughnut data={roleData} options={doughnutOptions} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-[90px]">
              <div className="text-center">
                <span className={`block text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.users.total}</span>
                <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Users</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Composition */}
        <div className={`p-6 rounded-2xl border flex flex-col ${bgClass}`}>
          <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Knowledge Base Files
          </h3>
          <div className="flex-1 min-h-[250px] relative">
            <Doughnut data={docTypeData} options={doughnutOptions} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-[90px]">
              <div className="text-center">
                <span className={`block text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.knowledgeBase.totalDocuments}</span>
                <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Docs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Query Volume Trends */}
        <div className={`p-6 rounded-2xl border flex flex-col shadow-sm xl:col-span-1 lg:col-span-2 ${bgClass}`}>
          <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Query Volume Trends
          </h3>
          <div className="flex-1 min-h-[250px]">
            <Bar data={queryFreqData} options={getOptions((v) => `${v} queries`)} />
          </div>
        </div>

      </div>

      {/* 3. HEALTH & ACTIVITY ROW */}
      <h2 className={`text-sm font-black uppercase tracking-widest pl-1 mt-8 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        System Health & Activity
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-xl border flex items-center justify-between ${bgClass}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Avg LLM Latency</p>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.aiUsage.avgLatencyMs}ms</p>
          </div>
          <div className={`p-3 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            ⚡
          </div>
        </div>
        
        <div className={`p-5 rounded-xl border flex items-center justify-between ${bgClass}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total AI Sessions</p>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.chatSessions.total}</p>
          </div>
          <div className={`p-3 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            💬
          </div>
        </div>

        <div className={`p-5 rounded-xl border flex items-center justify-between ${bgClass}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Vector DB Chunks</p>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.knowledgeBase.totalChunks.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            🧩
          </div>
        </div>
      </div>

      <HealthReportModal 
        isOpen={showReport} 
        onClose={() => setShowReport(false)} 
        reportMarkdown={reportData} 
      />

    </div>
  );
}
