'use client';

import React, { useState } from 'react';
import {
  Save, X, Upload, Eye, Check, AlertCircle,
  HelpCircle, Calendar, Hash, DollarSign, Type, MapPin
} from 'lucide-react';

export default function DynamicFormRenderer({
  schema = { title: 'Form', fields: [] },
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false
}) {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (fieldKey, value) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors(prev => ({ ...prev, [fieldKey]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    (schema.fields || []).forEach(field => {
      // Check conditional visibility
      if (field.condition) {
        const { targetField, operator, value } = field.condition;
        const currentVal = formData[targetField];
        if (operator === 'EQUALS' && currentVal !== value) return;
        if (operator === 'NOT_EQUALS' && currentVal === value) return;
      }

      if (field.required && (formData[field.key] === undefined || formData[field.key] === '' || formData[field.key] === null)) {
        newErrors[field.key] = `${field.label || field.key} mütləq daxil edilməlidir`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate() && onSubmit) {
      onSubmit(formData);
    }
  };

  const isFieldVisible = (field) => {
    if (!field.condition) return true;
    const { targetField, operator, value } = field.condition;
    const currentVal = formData[targetField];
    if (operator === 'EQUALS') return currentVal === value;
    if (operator === 'NOT_EQUALS') return currentVal !== value;
    return true;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-900">{schema.title || 'Dinamik Forma'}</h3>
        {schema.description && (
          <p className="text-xs text-gray-500 mt-1">{schema.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(schema.fields || []).filter(isFieldVisible).map(field => {
          const fieldError = errors[field.key];
          const fullWidth = field.type === 'textarea' || field.type === 'richtext' || field.fullWidth;

          return (
            <div key={field.key} className={fullWidth ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>
                  {field.label || field.key}
                  {field.required && <span className="text-rose-500 ml-1">*</span>}
                </span>
                {field.tooltip && (
                  <span className="text-gray-400 hover:text-gray-600" title={field.tooltip}>
                    <HelpCircle className="w-3.5 h-3.5 inline" />
                  </span>
                )}
              </label>

              {/* Text, Email, Password, URL, Phone */}
              {['text', 'email', 'password', 'url', 'phone', 'slug'].includes(field.type || 'text') && (
                <input
                  type={field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'}
                  placeholder={field.placeholder || ''}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm bg-gray-50/70 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                    fieldError ? 'border-rose-300 bg-rose-50/30' : 'border-gray-200'
                  }`}
                />
              )}

              {/* Number, Decimal, Currency, Percentage */}
              {['number', 'decimal', 'currency', 'percentage'].includes(field.type) && (
                <div className="relative">
                  {field.type === 'currency' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₼</span>
                  )}
                  <input
                    type="number"
                    step={field.type === 'number' ? '1' : '0.01'}
                    placeholder={field.placeholder || '0'}
                    value={formData[field.key] ?? ''}
                    onChange={(e) => handleChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full ${field.type === 'currency' ? 'pl-8' : 'px-3.5'} pr-3.5 py-2.5 text-sm bg-gray-50/70 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                      fieldError ? 'border-rose-300' : 'border-gray-200'
                    }`}
                  />
                  {field.type === 'percentage' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                  )}
                </div>
              )}

              {/* Textarea */}
              {field.type === 'textarea' && (
                <textarea
                  rows={field.rows || 3}
                  placeholder={field.placeholder || ''}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm bg-gray-50/70 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                    fieldError ? 'border-rose-300' : 'border-gray-200'
                  }`}
                />
              )}

              {/* Select & Relation Select */}
              {['select', 'relation'].includes(field.type) && (
                <select
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                >
                  <option value="">Seçin...</option>
                  {(field.options || []).map(opt => (
                    <option key={opt.value ?? opt.id} value={opt.value ?? opt.id}>
                      {opt.label ?? opt.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Boolean Switch / Checkbox */}
              {['boolean', 'checkbox', 'switch'].includes(field.type) && (
                <label className="flex items-center gap-3 cursor-pointer py-1.5">
                  <input
                    type="checkbox"
                    checked={Boolean(formData[field.key])}
                    onChange={(e) => handleChange(field.key, e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 h-5 w-5"
                  />
                  <span className="text-xs text-gray-600">{field.checkboxLabel || 'Aktiv et'}</span>
                </label>
              )}

              {/* Date / DateTime */}
              {['date', 'datetime'].includes(field.type) && (
                <input
                  type={field.type === 'datetime' ? 'datetime-local' : 'date'}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              )}

              {fieldError && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {fieldError}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Form Footer */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            Ləğv et
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Yadda saxlanılır...' : 'Yadda Saxla'}</span>
        </button>
      </div>
    </form>
  );
}
