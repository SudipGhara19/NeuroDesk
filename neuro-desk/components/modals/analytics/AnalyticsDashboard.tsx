'use client';

import React from 'react';
import { UserRecord } from '@/lib/features/users/usersSlice';
import { BsGraphUp, BsFileEarmarkTextFill, BsLightningFill, BsClockHistory, BsCashStack } from 'react-icons/bs';

import QueryFrequencyChart from './QueryFrequencyChart';
import SessionHistoryChart from './SessionHistoryChart';
import TokenUsageChart from './TokenUsageChart';

interface AnalyticsDashboardProps {
  user: UserRecord;
  theme: string;
}

export default function AnalyticsDashboard({ user, theme }: AnalyticsDashboardProps) {
  const isDark = theme === 'dark';
  const stats = user.stats || {};
  const analytics = user.analytics || {};

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Top Value Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<BsGraphUp />} label="Total Queries" value={stats.totalQueries?.toLocaleString() || '0'} isDark={isDark} />
        <StatCard icon={<BsFileEarmarkTextFill />} label="Documents" value={stats.docsUploaded?.toLocaleString() || '0'} isDark={isDark} />
        <StatCard icon={<BsLightningFill />} label="Tokens Used" value={stats.totalTokensUsed?.toLocaleString() || '0'} isDark={isDark} />
        <StatCard icon={<BsClockHistory />} label="Error Rate" value={`${(stats.errorRate || 0)}%`} isDark={isDark} />
        <StatCard icon={<BsCashStack />} label="Est. Cost" value={`$${(stats.totalCostEstimate || 0).toFixed(2)}`} isDark={isDark} />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Query Frequency (Spans 2 cols on lg) */}
        <div className={`lg:col-span-2 p-5 rounded-3xl border flex flex-col ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="mb-4">
            <h3 className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Query Frequency Trend
            </h3>
            <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              6-Month Estimated Activity
            </p>
          </div>
          <div className="h-64 sm:h-72 w-full mt-auto">
            <QueryFrequencyChart data={analytics.queryFrequency || {}} theme={theme} />
          </div>
        </div>

        {/* Right Col: Token Usage Doughnut */}
        <div className={`p-5 rounded-3xl border flex flex-col items-center justify-between ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="w-full text-center mb-6">
            <h3 className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Token Allowance
            </h3>
            <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Usage vs Threshold
            </p>
          </div>
          <div className="w-48 h-48 sm:w-56 sm:h-56">
            <TokenUsageChart usedTokens={stats.totalTokensUsed || 0} theme={theme} />
          </div>
          <div className="w-full mt-6 flex justify-between px-4 text-sm font-bold">
            <div className="flex flex-col items-center">
              <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>Used</span>
              <span className={isDark ? 'text-white' : 'text-gray-900'}>{stats.totalTokensUsed?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Limit</span>
              <span className={isDark ? 'text-white' : 'text-gray-900'}>100k+</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Session history bar chart */}
        <div className={`p-5 rounded-3xl border flex flex-col ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="mb-4">
            <h3 className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Recent Sessions
            </h3>
            <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Duration in Minutes
            </p>
          </div>
          <div className="h-48 w-full mt-auto">
            <SessionHistoryChart sessions={analytics.sessionHistory} theme={theme} />
          </div>
        </div>

        {/* Popular searches / Tags */}
        <div className={`p-5 rounded-3xl border flex flex-col ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="mb-6">
            <h3 className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Popular Search Patterns
            </h3>
            <p className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Frequently asked topics
            </p>
          </div>
          
          <div className="flex-1 flex items-center justify-center min-h-[12rem]">
            {analytics.popularSearchPatterns && analytics.popularSearchPatterns.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {analytics.popularSearchPatterns.map((pattern, idx) => (
                  <span key={idx} className={`px-4 py-2 text-sm font-bold rounded-xl transition-transform hover:scale-105 ${
                    isDark 
                      ? 'bg-white/10 text-gray-200 border border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.2)]' 
                      : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
                  }`}>
                    {pattern}
                  </span>
                ))}
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-2xl ${
                isDark ? 'border-white/10 text-gray-500' : 'border-gray-200 text-gray-400'
              }`}>
                <BsGraphUp className="text-3xl mb-2 opacity-50" />
                <p className="text-sm font-bold">No patterns identified yet</p>
                <p className="text-xs mt-1 max-w-[200px]">The user hasn&apos;t made enough consistent queries to form patterns.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, isDark }: { icon: React.ReactNode; label: string; value: string; isDark: boolean }) {
  return (
    <div className={`flex flex-col p-4 rounded-2xl border ${
      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-sm'
    } transition-all`}>
      <div className="flex items-center gap-3 mb-3 text-primary">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {label}
        </span>
      </div>
      <div className={`text-2xl font-black mt-auto tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}
