'use client';

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TokenUsageChartProps {
  usedTokens: number;
  theme: string;
}

export default function TokenUsageChart({ usedTokens = 0, theme }: TokenUsageChartProps) {
  const isDark = theme === 'dark';
  
  // A hypothetical limit for visual comparison (e.g. 1M tokens)
  const LIMIT = 100000; 
  const remaining = Math.max(0, LIMIT - usedTokens);
  const percentage = Math.min(100, Math.round((usedTokens / LIMIT) * 100));

  const usedColor = isDark ? 'rgba(59, 130, 246, 0.9)' : 'rgba(37, 99, 235, 0.9)'; // blue
  const remainColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const hoverColor = isDark ? 'rgba(59, 130, 246, 1)' : 'rgba(37, 99, 235, 1)';
  const borderColor = isDark ? '#1e1e1e' : '#ffffff';

  const data = {
    labels: ['Used Tokens', 'Remaining Allowance (Est.)'],
    datasets: [
      {
        data: [usedTokens, remaining],
        backgroundColor: [usedColor, remainColor],
        hoverBackgroundColor: [hoverColor, remainColor],
        borderColor: [borderColor, borderColor],
        borderWidth: 2,
        cutout: '75%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDark ? '#ffffff' : '#000000',
        bodyColor: isDark ? '#d1d5db' : '#374151',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.toLocaleString();
            return label;
          }
        }
      },
    },
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {percentage}%
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Used
        </span>
      </div>
      <Doughnut data={data} options={options} />
    </div>
  );
}
