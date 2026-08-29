'use client';

import {
  TrendingUp, DollarSign, ShoppingBag, Users, Activity,
  Package, Sparkles, FolderTree, FileText, Video,
  MousePointerClick, CheckSquare, BarChart3, Image as ImageIcon,
  ExternalLink, Layers, ArrowRight, Star, Search
} from 'lucide-react';

export default function DynamicWidgetRenderer({ component = {}, widget = {} }) {
  // Support both component and widget prop signatures
  const item = component?.id ? component : (widget?.type ? widget : (component?.type ? component : {}));
  const { type = 'Heading', props = {}, style = {} } = item;

  // 0. Search Widget
  if (type === 'Search') {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm focus-within:border-emerald-500 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={props.placeholder || "Məhsul, şirkət, gübrə, texnika axtar..."}
            className="flex-1 bg-transparent text-xs text-gray-800 outline-none font-medium"
            readOnly
          />
          <button type="button" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs">
            Axtar
          </button>
        </div>
      </div>
    );
  }

  // 1. Heading
  if (type === 'Heading') {
    const Tag = props.level || 'h2';
    const sizeClasses = {
      h1: 'text-3xl font-black tracking-tight sm:text-4xl',
      h2: 'text-2xl font-black tracking-tight sm:text-3xl',
      h3: 'text-xl font-bold',
      h4: 'text-lg font-bold'
    };
    return (
      <div style={{ textAlign: props.align || 'left', color: props.color || '#111827' }} className="py-2">
        <Tag className={`${sizeClasses[Tag] || sizeClasses.h2}`}>
          {props.text || 'Başlıq Mətni'}
        </Tag>
      </div>
    );
  }

  // 2. Text / Paragraph
  if (type === 'Text') {
    return (
      <div style={{ textAlign: props.align || 'left' }} className="py-2 text-gray-600 text-sm leading-relaxed">
        <p>{props.text || 'Mətn daxil edilməyib...'}</p>
      </div>
    );
  }

  // 3. Image
  if (type === 'Image') {
    return (
      <div className={`overflow-hidden py-2 ${props.rounded ? 'rounded-2xl' : ''} ${props.shadow ? 'shadow-lg' : ''}`}>
        <img
          src={props.src || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'}
          alt={props.alt || 'Şəkil'}
          className="w-full h-auto max-h-[360px] object-cover"
        />
      </div>
    );
  }

  // 4. Button
  if (type === 'Button') {
    const variantClasses = {
      primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md',
      secondary: 'bg-gray-900 hover:bg-gray-800 text-white shadow-md',
      outline: 'border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50'
    };
    return (
      <div className="py-2" style={{ textAlign: props.align || 'left' }}>
        <button
          type="button"
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${variantClasses[props.variant] || variantClasses.primary}`}
        >
          <span>{props.text || 'Düymə'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 5. Divider
  if (type === 'Divider') {
    return (
      <div className="py-3">
        <hr style={{ borderColor: props.color || '#e5e7eb', borderStyle: props.style || 'solid', width: props.width || '100%' }} />
      </div>
    );
  }

  // 6. Spacer
  if (type === 'Spacer') {
    return <div style={{ height: props.height || '32px' }} className="w-full" />;
  }

  // 7. Video
  if (type === 'Video') {
    return (
      <div className="py-2">
        <div className="relative aspect-video rounded-2xl bg-gray-900 overflow-hidden shadow-lg flex items-center justify-center text-white">
          <div className="w-14 h-14 rounded-full bg-emerald-600/90 flex items-center justify-center shadow-xl">
            <Video className="w-6 h-6 ml-0.5" />
          </div>
          <span className="absolute bottom-3 left-4 text-xs font-mono bg-black/60 px-2 py-1 rounded-md">
            {props.url || 'YouTube / Video Link'}
          </span>
        </div>
      </div>
    );
  }

  // 8. ProductList (Agrar / E-Commerce Grid)
  if (type === 'ProductList') {
    return (
      <div className="py-4 space-y-3">
        {props.title && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-900">{props.title}</h3>
            <span className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">Hamısına bax →</span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 bg-white rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
              <div className="h-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-2">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Məhsul #{i}</span>
                <p className="text-xs font-bold text-gray-900 truncate">Orqanik Gübrə & Toxum</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-700">{(i * 12.5).toFixed(2)} AZN</span>
                  <div className="flex items-center text-amber-500 text-[10px]"><Star className="w-3 h-3 fill-amber-500" /> 4.9</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 9. CategoriesSlider
  if (type === 'CategoriesSlider') {
    return (
      <div className="py-3">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['Toxumlar', 'Gübrələr', 'Dərmanlar', 'Aqrotexnika', 'Suvarma', 'Bağçılıq'].map((cat, i) => (
            <div key={i} className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold whitespace-nowrap shrink-0 shadow-2xs">
              <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
              <span>{cat}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 10. Card / CTA Banner
  if (type === 'Card' || type === 'CTA_BANNER') {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-700 text-white shadow-lg relative overflow-hidden my-2">
        <div className="relative z-10 max-w-lg">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-wider mb-2">
            Xüsusi Bölmə
          </span>
          <h4 className="text-xl font-black tracking-tight">{props.title || 'Blok Başlığı'}</h4>
          <p className="text-xs sm:text-sm text-brand-100 mt-1.5 leading-relaxed">{props.description || 'Açıqlama mətni burada yerləşir'}</p>
          {props.buttonText && (
            <button
              type="button"
              className="mt-4 px-5 py-2.5 text-xs font-bold bg-white text-brand-800 rounded-xl hover:bg-brand-50 shadow-md transition-all inline-flex items-center gap-2"
            >
              <span>{props.buttonText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 11. AIAgronomist Block
  if (type === 'AIAgronomist') {
    return (
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 text-white shadow-xl my-2 border border-purple-700/50">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-purple-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-black">{props.title || 'AI Aqronom Köməkçi'}</h4>
            <span className="text-[10px] text-purple-300">Süni İntellektlə Bitki Diaqnostikası</span>
          </div>
        </div>
        <p className="text-xs text-purple-200 mt-1">{props.description || 'Bitkinin yarpağının şəklini yükləyin, xəstəliyi və müalicə üsulunu dərhal öyrənin.'}</p>
        <button type="button" className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
          <Sparkles className="w-3.5 h-3.5" /> Bitkini Yoxla
        </button>
      </div>
    );
  }

  // 12. KPICard
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
      <div className={`p-5 rounded-2xl bg-gradient-to-br ${colorClasses[color] || colorClasses.emerald} border shadow-sm flex flex-col justify-between hover:shadow-md transition-all my-1`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{props.title || 'KPI'}</span>
          <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-600" />
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

  // 13. LineChart
  if (type === 'LineChart') {
    return (
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm my-2 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900">{props.title || 'Statistika Qrafiki'}</h4>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Canlı</span>
        </div>
        <div className="h-32 bg-gray-50 rounded-xl flex items-end justify-between p-3 gap-2 border border-gray-100">
          {[40, 65, 30, 80, 95, 75, 100].map((h, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div style={{ height: `${h}%` }} className="w-full bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600" />
              <span className="text-[9px] text-gray-400 font-mono">D{idx+1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 14. Form
  if (type === 'Form') {
    return (
      <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm my-2 space-y-3">
        <h4 className="text-sm font-bold text-gray-900">{props.title || 'Əlaqə Formu'}</h4>
        <input type="text" placeholder="Ad və Soyadınız" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none" readOnly />
        <input type="email" placeholder="E-poçt ünvanınız" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none" readOnly />
        <button type="button" className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs">
          {props.submitText || 'Göndər'}
        </button>
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
      <div>
        <h4 className="text-xs font-bold text-gray-800">{props.title || type}</h4>
        <span className="text-[10px] text-gray-400">Elementor Widget: {type}</span>
      </div>
      <Layers className="w-4 h-4 text-gray-400" />
    </div>
  );
}
