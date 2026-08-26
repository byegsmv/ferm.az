'use client';

import React, { useState, useEffect } from 'react';
import {
  GitBranch, Plus, ArrowRight, Zap, CheckCircle2,
  Trash2, RefreshCw, Save, Layers, Bell, Shield
} from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowIndex, setSelectedWorkflowIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/admin/workflows');
      if (res && res.workflows) {
        setWorkflows(res.workflows);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const showToast = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiFetch('/api/admin/workflows', {
        method: 'POST',
        body: JSON.stringify({ workflows })
      });
      showToast('İş axınları və avtomatlaşdırmalar uğurla yadda saxlanıldı');
    } catch (err) {
      console.error(err);
      showToast('Xəta baş verdi');
    } finally {
      setIsSaving(false);
    }
  };

  const currentWorkflow = workflows[selectedWorkflowIndex] || null;

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center bg-white rounded-3xl border border-gray-200">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mr-2" />
        <span className="text-sm font-bold text-gray-700">İş axınları yüklənir...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Workflows & Visual Automation Builder</h2>
              <p className="text-xs text-gray-500">Məhsul, sifariş və istifadəçi statuslarının vizual idarəetməsi</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saxlanılır...' : 'Bütün Axınları Saxla'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Workflow List */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-4 space-y-2 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider px-3 py-1">Sistem Axınları</h3>
          {workflows.map((wf, idx) => (
            <button
              key={wf.id}
              onClick={() => setSelectedWorkflowIndex(idx)}
              className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between ${
                selectedWorkflowIndex === idx
                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold shadow-xs'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div>
                <span className="block text-xs font-bold">{wf.name}</span>
                <span className="text-[11px] text-gray-400">{wf.entity} Modulu</span>
              </div>
              <ArrowRight className={`w-4 h-4 ${selectedWorkflowIndex === idx ? 'text-indigo-600' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>

        {/* Right Workflow Visual Canvas */}
        <div className="lg:col-span-3 space-y-6">
          {currentWorkflow && (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-black text-gray-900">{currentWorkflow.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{currentWorkflow.description}</p>
              </div>

              {/* Status Nodes Visual Pipeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Mərhələlər və Statuslar</h4>
                <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50/70 rounded-2xl border border-gray-200/70">
                  {currentWorkflow.states.map((st, sIdx) => (
                    <React.Fragment key={st.id}>
                      <div className="px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          st.color === 'emerald' ? 'bg-emerald-500' :
                          st.color === 'amber' ? 'bg-amber-500' :
                          st.color === 'blue' ? 'bg-blue-500' :
                          st.color === 'rose' ? 'bg-rose-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-xs font-bold text-gray-800">{st.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">({st.id})</span>
                      </div>
                      {sIdx < currentWorkflow.states.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Status Transitions Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">İcazə Verilmiş Keçidlər</h4>
                <div className="space-y-2">
                  {currentWorkflow.transitions.map((tr, tIdx) => (
                    <div
                      key={tIdx}
                      className="p-3.5 bg-gray-50/50 rounded-2xl border border-gray-200/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 px-2.5 py-1 bg-white rounded-lg border border-gray-200">{tr.from}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-bold text-brand-700 px-2.5 py-1 bg-brand-50 rounded-lg border border-brand-200">{tr.to}</span>
                        <span className="text-gray-500 font-medium ml-2">“{tr.label}”</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {tr.roles.map(r => (
                          <span key={r} className="px-2 py-0.5 rounded-md bg-gray-200 text-[10px] font-bold text-gray-700">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Automations Block */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Avtomatlaşdırma Qaydaları</span>
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {(currentWorkflow.automations || []).map(auto => (
                    <div key={auto.id} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                        <span>Status <strong>{auto.onTransition.from}</strong> ➔ <strong>{auto.onTransition.to}</strong> keçəndə:</span>
                      </div>
                      <div className="space-y-1.5">
                        {auto.actions.map((act, aIdx) => (
                          <div key={aIdx} className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded-xl border border-amber-200/40">
                            <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{act.type}: <strong>{act.title || act.details || 'Əməliyyat'}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
