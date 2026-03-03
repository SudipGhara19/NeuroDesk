'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import api from '@/lib/axios';
import { BsCheckCircle, BsExclamationTriangle } from 'react-icons/bs';

interface SystemSettings {
  allowRegistration: boolean;
  defaultAiModel: string;
  customSystemPrompt: string;
  ragTopK: number;
  ragConfidenceThreshold: number;
  chunkSize: number;
  chunkOverlap: number;
}

export default function Settings() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [settings, setSettings] = useState<SystemSettings>({
    allowRegistration: true,
    defaultAiModel: 'llama-3.1-8b-instant',
    customSystemPrompt: '',
    ragTopK: 5,
    ragConfidenceThreshold: 0.15,
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Available Groq Models
  const AI_MODELS = [
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast, Default)' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (High Quality)' },
    { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B (OpenAI Open Source)' },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setMessage({ type: 'error', text: 'Failed to load system settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await api.put('/settings', settings);
      setMessage({ type: 'success', text: 'System settings updated successfully.' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage({ type: 'error', text: 'Failed to save system settings. Please check your connection.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' || type === 'range' 
          ? parseFloat(value) 
          : value
    }));
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
          <p className="font-medium tracking-wide">Loading System Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>System Settings</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage global application configurations and AI behaviors.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            saving 
              ? (isDark ? 'bg-purple-900/50 text-purple-400 cursor-wait' : 'bg-purple-100 text-purple-400 cursor-wait')
              : 'bg-purple-600 hover:bg-purple-500 text-white hover:-translate-y-0.5 shadow-purple-500/20'
          }`}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <BsCheckCircle className="w-4 h-4" />
          )}
          {saving ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${
          message.type === 'success' 
            ? (isDark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-200 text-green-700')
            : (isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-700')
        }`}>
          {message.type === 'success' ? <BsCheckCircle className="w-5 h-5 mt-0.5 shrink-0" /> : <BsExclamationTriangle className="w-5 h-5 mt-0.5 shrink-0" />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Access Controls Panel */}
      <div className={`p-6 md:p-8 rounded-2xl border ${isDark ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-gray-100'}`}>
        <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Access Controls
        </h3>
        
        <div className="flex items-center justify-between p-4 rounded-xl border bg-black/5 dark:bg-white/5 dark:border-white/5 border-gray-100">
          <div>
            <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Open User Registration</h4>
            <p className={`text-xs mt-1 max-w-md leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              When enabled, new users can sign up for the platform. Turn this off to restrict access to invite-only or manual Admin creation.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              name="allowRegistration"
              className="sr-only peer" 
              checked={settings.allowRegistration}
              onChange={handleChange}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      {/* AI Intelligence Panel */}
      <div className={`p-6 md:p-8 rounded-2xl border ${isDark ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-gray-100'}`}>
        <h3 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          AI Intelligence <span className="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 px-2 py-0.5 rounded text-[10px]">CORE</span>
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Default Processing Model
            </label>
            <p className={`text-xs mb-3 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Select the default Large Language Model used for answering document queries when users start a new session.
            </p>
            <select
              name="defaultAiModel"
              value={settings.defaultAiModel}
              onChange={handleChange}
              className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                isDark 
                  ? 'bg-black border-white/10 text-white focus:border-purple-500 hover:border-white/20' 
                  : 'bg-gray-50 border-gray-200 text-black focus:border-purple-500 hover:border-gray-300'
              }`}
            >
              {AI_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t dark:border-white/5 border-gray-100">
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Base System Prompt
            </label>
            <p className={`text-xs mb-3 leading-relaxed max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              This is the foundational prompt injected into every RAG query. It defines the AI&apos;s personality, strictness, and rules of engagement. Modify this carefully to shape how the AI responds to your users.
            </p>
            <textarea
              name="customSystemPrompt"
              value={settings.customSystemPrompt}
              onChange={handleChange}
              rows={12}
              className={`w-full p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono text-sm leading-relaxed ${
                isDark 
                  ? 'bg-black border-white/10 text-gray-300 focus:border-purple-500 hover:border-white/20' 
                  : 'bg-gray-50 border-gray-200 text-gray-700 focus:border-purple-500 hover:border-gray-300'
              }`}
            />
            <p className={`text-[10px] mt-2 font-medium uppercase tracking-wider ${isDark ? 'text-purple-400/50' : 'text-purple-600/50'}`}>
              <BsExclamationTriangle className="inline w-3 h-3 mb-0.5 mr-1" />
              The RAG context and user query will be appended directly below this prompt.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Vector Engine Panel */}
      <div className={`p-6 md:p-8 rounded-2xl border ${isDark ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-gray-100'}`}>
        <h3 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Advanced Vector Engine <span className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded text-[10px]">RAG</span>
        </h3>
        
        <div className="space-y-8">
          {/* Top K */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className={`block text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Retrieval Depth (Top-K)
              </label>
              <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {settings.ragTopK} chunks
              </span>
            </div>
            <p className={`text-xs mb-4 leading-relaxed max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              The maximum number of document chunks fetched from Pinecone per AI query. Higher values provide more context but drastically increase latency and Groq Token costs.
            </p>
            <input
              type="range"
              title="Retrieval Depth"
              name="ragTopK"
              min="1"
              max="20"
              step="1"
              value={settings.ragTopK}
              onChange={handleChange}
              className="w-full xl:max-w-xl appearance-none h-2 bg-gray-200 dark:bg-white/10 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
            />
          </div>

          <div className="pt-6 border-t dark:border-white/5 border-gray-100">
            <div className="flex justify-between items-end mb-2">
              <label className={`block text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                AI Confidence Threshold
              </label>
              <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {settings.ragConfidenceThreshold.toFixed(2)} score
              </span>
            </div>
            <p className={`text-xs mb-4 leading-relaxed max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              The minimum similarity score required to include a document chunk in the AI&apos;s answer. Lower scores pull more distant information; higher scores restrict the AI to only perfect matches.
            </p>
            <input
              type="range"
              title="Confidence Threshold"
              name="ragConfidenceThreshold"
              min="0.05"
              max="0.80"
              step="0.05"
              value={settings.ragConfidenceThreshold}
              onChange={handleChange}
              className="w-full xl:max-w-xl appearance-none h-2 bg-gray-200 dark:bg-white/10 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
            />
          </div>

          <div className="pt-6 border-t dark:border-white/5 border-gray-100">
            <h4 className={`text-sm font-bold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Knowledge Indexing Boundaries</h4>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Upload Chunk Size
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="chunkSize"
                    value={settings.chunkSize}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm ${
                      isDark 
                        ? 'bg-black border-white/10 text-white focus:border-blue-500 hover:border-white/20' 
                        : 'bg-gray-50 border-gray-200 text-black focus:border-blue-500 hover:border-gray-300'
                    }`}
                  />
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>words</span>
                </div>
              </div>
              
              <div className="flex-1">
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Overlap Padding
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="chunkOverlap"
                    value={settings.chunkOverlap}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm ${
                      isDark 
                        ? 'bg-black border-white/10 text-white focus:border-blue-500 hover:border-white/20' 
                        : 'bg-gray-50 border-gray-200 text-black focus:border-blue-500 hover:border-gray-300'
                    }`}
                  />
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>words</span>
                </div>
              </div>
            </div>
            <p className={`text-[10px] mt-3 font-medium ${isDark ? 'text-amber-500/80' : 'text-orange-500/80'}`}>
              <BsExclamationTriangle className="inline w-3 h-3 mb-0.5 mr-1" />
              Note: Changing these boundaries only affects <b>future</b> document uploads, not currently indexed files.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
