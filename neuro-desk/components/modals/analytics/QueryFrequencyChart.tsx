'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarElement
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

interface QueryFrequencyChartProps {
  data: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  theme: string;
}

export default function QueryFrequencyChart({ data, theme }: QueryFrequencyChartProps) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#6b7280'; // gray-400 : gray-500
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const primaryColor = isDark ? '#3b82f6' : '#2563eb'; // blue-500 : blue-600
  const primaryLight = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.2)';

  const daily = data.daily || 0;
  const weekly = data.weekly || 0;
  const monthly = data.monthly || 0;

  const chartData = {
    labels: ['Daily', 'Weekly', 'Monthly'],
    datasets: [
      {
        label: 'Queries',
        data: [daily, weekly, monthly],
        backgroundColor: primaryColor,
        hoverBackgroundColor: primaryLight,
        borderRadius: 4,
        barPercentage: 0.5,
        categoryPercentage: 0.7,
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
