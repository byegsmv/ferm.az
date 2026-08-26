'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield, Check, X, Save, RefreshCw, CheckCircle2,
  Lock, Eye, Edit3, Trash2, Key, Users
} from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';

export default function PermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [actions, setActions] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [fieldPermissions, setFieldPermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const modulesList = [
    { key: 'products', label: 'Məhsullar & Kataloq' },
    { key: 'orders', label: 'Sifarişlər & Ödənişlər' },
    { key: 'users', label: 'İstifadəçilər & Fermerlər' },
    { key: 'settings', label: 'Sistem Tənzimləmələri' },
    { key: 'builder', label: 'Visual System Builder' }
  ];

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/admin/permissions/engine');
      if (res && res.success) {
        setRoles(res.roles || []);
        setActions(res.actions || []);
        setMatrix(res.matrix || {});
        setFieldPermissions(res.fieldPermissions || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const showToast = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  };

  const togglePermission = (moduleKey, actionKey) => {
    setMatrix(prev => {
      const rolePerms = prev[selectedRole] || {};
      const moduleActions = rolePerms[moduleKey] || [];
      const hasAction = moduleActions.includes(actionKey);

      const updatedActions = hasAction
        ? moduleActions.filter(a => a !== actionKey)
        : [...moduleActions, actionKey];

      return {
        ...prev,
        [selectedRole]: {
          ...rolePerms,
          [moduleKey]: updatedActions
        }
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiFetch('/api/admin/permissions/engine', {
        method: 'POST',
        body: JSON.stringify({ matrix, fieldPermissions })
      });
      showToast('Bütün icazə matrisi uğurla yadda saxlanıldı');
    } catch (err) {
      console.error(err);
      showToast('Xəta baş verdi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center bg-white rounded-3xl border border-gray-200">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mr-2" />
        <span className="text-sm font-bold text-gray-700">İcazələr yüklənir...</span>
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
            <div className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Dinamik RBAC & İcazə Qoruyucusu</h2>
              <p className="text-xs text-gray-500">Rollar, modul icazələri və sahə (field-level) səviyyəli giriş qaydaları</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saxlanılır...' : 'İcazələri Saxla'}</span>
        </button>
      </div>

      {/* Role Picker Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-sm flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-gray-400 px-3 uppercase">Rol Seçin:</span>
        {roles.map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedRole(r.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedRole === r.id
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Permissions Matrix Grid */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              <strong className="text-brand-600">[{selectedRole}]</strong> Rolu üçün İcazə Matrisi
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Hər modul üzrə icazə verilən əməliyyatları seçin</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4">Modul</th>
                {actions.map(act => (
                  <th key={act.key} className="p-4 text-center">{act.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {modulesList.map(mod => {
                const currentActions = matrix[selectedRole]?.[mod.key] || [];

                return (
                  <tr key={mod.key} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-bold text-gray-900">{mod.label}</td>
                    {actions.map(act => {
                      const hasPerm = currentActions.includes(act.key) || matrix[selectedRole]?.all === true;

                      return (
                        <td key={act.key} className="p-4 text-center">
                          <button
                            onClick={() => togglePermission(mod.key, act.key)}
                            className={`w-6 h-6 rounded-lg inline-flex items-center justify-center transition-all ${
                              hasPerm
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-400'
                            }`}
                          >
                            {hasPerm ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
