'use client';

import React from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Users, Activity, Package, ShieldCheck, AlertTriangle
} from 'lucide-react';

export default function DynamicWidgetRenderer({ widget = {} }) {
  const { type = 'KPICard', props = {} } = widget;

  if (type === 'KPICard') {
    const colorClasses = {
      emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-200/60',
      blue: 'from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-200/60',
      purple: 'from-purple-500/10 to-purple-500/5 text-purple-600 border-purple-200/60',
      amber: 'from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-200/60',
      rose: 'from-rose-500/10 to-rose-500/5 text-rose-600 border-rose-200/60'
    };

    const color = props.color || 'emerald';

    return (
      <div className={`p-5 rounded-2xl bg-gradient-to-br ${colorClasses[color] || colorClasses.emerald} border shadow-sm flex flex-col justify-between hover:shadow-md transition-all`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{props.title || 'KPI'}</span>
          <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center">
            {props.icon === 'ShoppingBag' ? (
              <ShoppingBag className="w-4 h-4" />
            ) : props.icon === 'Users' ? (
              <Users className="w-4 h-4" />
            ) : props.icon === 'Activity' ? (
              <Activity className="w-4 h-4" />
            ) : (
              <DollarSign className="w-4 h-4" />
            )}
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-2xl font-black text-gray-900 tracking-tight">{props.value || '0'}</span>
          {props.trend && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              {props.trend}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (type === 'Card' || type === 'CTA_BANNER') {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-700 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <h4 className="text-xl font-black tracking-tight">{props.title || 'Blok Başlığı'}</h4>
          <p className="text-xs sm:text-sm text-brand-100 mt-1.5">{props.description || 'Açıqlama mətni burada yerləşir'}</p>
          {props.buttonText && (
            <a
              href={props.buttonUrl || '#'}
              className="inline-block mt-4 px-4 py-2 text-xs font-bold bg-white text-brand-800 rounded-xl hover:bg-brand-50 shadow-md transition-all"
            >
              {props.buttonText}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <h4 className="text-sm font-bold text-gray-800">{props.title || type}</h4>
      <p className="text-xs text-gray-400 mt-1">Dinamik komponent render olundu</p>
    </div>
  );
}
