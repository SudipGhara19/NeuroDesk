'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SessionHistoryChartProps {
  sessions?: {
    startTime?: string;
    endTime?: string;
    durationMs?: number;
  }[];
  theme: string;
}

export default function SessionHistoryChart({ sessions = [], theme }: SessionHistoryChartProps) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  
  // Use purple for sessions
  const barColor = isDark ? 'rgba(168, 85, 247, 0.8)' : 'rgba(147, 51, 234, 0.8)'; // purple-500 : purple-600
  const barHoverColor = isDark ? 'rgba(168, 85, 247, 1)' : 'rgba(147, 51, 234, 1)';

  // Process data or create mocks if less than 5 sessions
  const safeHistory = sessions && sessions.length > 0 ? [...sessions].slice(0, 7).reverse() : [];
  
  const labels: string[] = [];
  const data: number[] = [];

  if (safeHistory.length > 0) {
    safeHistory.forEach((session) => {
      const date = session.startTime ? new Date(session.startTime) : new Date();
      labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
      
      // Convert ms to minutes
      const mins = session.durationMs ? Math.round(session.durationMs / 60000) : 0;
      data.push(mins);
    });
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Session Duration (Minutes)',
        data,
        backgroundColor: barColor,
        hoverBackgroundColor: barHoverColor,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
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
        displayColors: false,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function (context: any) {
            return `${context.parsed.y} mins`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
          font: { size: 11 },
          stepSize: 10
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
          font: { size: 11 }
        }
      },
    },
  };

  return <Bar options={options} data={chartData} />;
}
