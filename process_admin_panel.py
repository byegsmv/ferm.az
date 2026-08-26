import re

with open("/app/tmp_work/fermer_yeni/src/components/dashboard/AdminPanel.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Top Import: add Icon import if not present
if 'import Icon from "@/components/ui/Icon";' not in content:
    content = content.replace(
        'import { useEffect, useState, useCallback } from "react";',
        'import { useEffect, useState, useCallback } from "react";\nimport Icon from "@/components/ui/Icon";'
    )

# 2. SIDEBAR_GROUPS emoji replacements
sidebar_replacements = [
    ('icon:"📊"', 'icon:"dashboard"'),
    ('icon:"⚡"', 'icon:"zap"'),
    ('icon:"📈"', 'icon:"trendingUp"'),
    ('icon:"⏳"', 'icon:"clock"'),
    ('icon:"📋"', 'icon:"clipboard"'),
    ('icon:"🏢"', 'icon:"building"'),
    ('icon:"🗂"', 'icon:"grid"'),
    ('icon:"🏪"', 'icon:"store"'),
    ('icon:"📦"', 'icon:"package"'),
    ('icon:"💰"', 'icon:"wallet"'),
    ('icon:"🎟"', 'icon:"tag"'),
    ('icon:"👥"', 'icon:"user"'),
    ('icon:"⭐"', 'icon:"star"'),
    ('icon:"🎁"', 'icon:"gift"'),
    ('icon:"📝"', 'icon:"fileText"'),
    ('icon:"📣"', 'icon:"bell"'),
    ('icon:"🖼"', 'icon:"image"'),
    ('icon:"🔔"', 'icon:"bell"'),
    ('icon:"🎠"', 'icon:"image"'),
    ('icon:"🔧"', 'icon:"settings"'),
    ('icon:"🧩"', 'icon:"component"'),
]

for old, new in sidebar_replacements:
    content = content.replace(old, new)

# 3. Sidebar and MobileNav icon rendering
content = content.replace(
    '<span className="text-base shrink-0">{item.icon}</span>',
    '<Icon name={item.icon} size={18} className="shrink-0" />'
)
content = content.replace(
    '<span>{item.icon}</span>',
    '<Icon name={item.icon} size={16} />'
)

# 4. Large trend icon in Revenue / Stats
content = content.replace(
    '<div className="text-5xl opacity-20">📈</div>',
    '<div className="text-gray-300 opacity-20"><Icon name="trendingUp" size={48} /></div>'
)

# 5. ACTION_ICONS object and rendering
content = content.replace(
    'const ACTION_ICONS = { REVIEW_CREATED:"⭐", REVIEW_APPROVED:"✅", REVIEW_REJECTED:"❌", ORDER_CREATED:"📦", USER_BANNED:"🚫", PRODUCT_APPROVED:"✅", LOGIN:"🔑" };',
    'const ACTION_ICONS = { REVIEW_CREATED:"star", REVIEW_APPROVED:"checkCircle", REVIEW_REJECTED:"closeCircle", ORDER_CREATED:"package", USER_BANNED:"ban", PRODUCT_APPROVED:"checkCircle", LOGIN:"key" };'
)
content = content.replace(
    '<span className="text-lg shrink-0 mt-0.5">{ACTION_ICONS[log.action]||"📌"}</span>',
    '<span className="shrink-0 mt-0.5 text-gray-500"><Icon name={ACTION_ICONS[log.action]||"info"} size={18} /></span>'
)

# 6. Toast messages (removing checkmark ✓, emojis)
toast_replacements = [
    ('toast(status==="ACTIVE"?"Elan təsdiqləndi ✓":"Elan rədd edildi","success");', 'toast(status==="ACTIVE"?"Elan təsdiqləndi":"Elan rədd edildi","success");'),
    ('toast("Güncəlləndi ✓");', 'toast("Güncəlləndi");'),
    ('toast("Status dəyişdirildi ✓");', 'toast("Status dəyişdirildi");'),
    ('toast("Rəy təsdiqləndi ✓");', 'toast("Rəy təsdiqləndi");'),
    ('toast("Kateqoriya əlavə edildi ✓");', 'toast("Kateqoriya əlavə edildi");'),
    ('toast("Yeniləndi ✓");', 'toast("Yeniləndi");'),
    ('toast(action==="approve"?"✅ Ödəniş təsdiqləndi":"❌ Ödəniş rədd edildi — məbləğ geri qaytarıldı");', 'toast(action==="approve"?"Ödəniş təsdiqləndi":"Ödəniş rədd edildi — məbləğ geri qaytarıldı");'),
    ('toast("Bloq yazısı əlavə edildi ✓");', 'toast("Bloq yazısı əlavə edildi");'),
    ('toast(`${d.sent||0} abunəçiyə göndərildi ✓`);', 'toast(`${d.sent||0} abunəçiyə göndərildi`);'),
    ('toast(val?"✅ Aktivləşdirildi":"⛔ Deaktiv edildi");', 'toast(val?"Aktivləşdirildi":"Deaktiv edildi");'),
    ('toast("Kupon əlavə edildi ✓");', 'toast("Kupon əlavə edildi");'),
    ('toast(status==="ACTIVE"?"✅ Elan təsdiqləndi":"⛔ Elan rədd edildi");', 'toast(status==="ACTIVE"?"Elan təsdiqləndi":"Elan rədd edildi");'),
    ('toast("Min sifariş güncəlləndi ✓");', 'toast("Min sifariş güncəlləndi");'),
    ('toast("✅ Kampaniya əlavə edildi");', 'toast("Kampaniya əlavə edildi");'),
    ('toast("Reklam yeri yeniləndi ✓");', 'toast("Reklam yeri yeniləndi");'),
]

for old, new in toast_replacements:
    content = content.replace(old, new)

# 7. Select options (Rule 6)
content = content.replace(
    '{STATUSES.map(s=><option key={s} value={s}>{s==="PENDING_REVIEW"?"⏳ Gözləyən":s==="ACTIVE"?"✅ Aktiv":s==="REJECTED"?"❌ Rədd":s==="SOLD"?"💰 Satılıb":s==="DRAFT"?"📝 Qaralama":"⌛ Bitmib"}</option>)}',
    '{STATUSES.map(s=><option key={s} value={s}>{s==="PENDING_REVIEW"?"Gözləyən":s==="ACTIVE"?"Aktiv":s==="REJECTED"?"Rədd":s==="SOLD"?"Satılıb":s==="DRAFT"?"Qaralama":"Bitmib"}</option>)}'
)

# Color dropdown options in Slider manager
content = content.replace('{ value: "from-brand-700 to-brand-500", label: "🟢 Yaşıl" }', '{ value: "from-brand-700 to-brand-500", label: "Yaşıl" }')
content = content.replace('{ value: "from-amber-600 to-amber-400", label: "🟡 Sarı" }', '{ value: "from-amber-600 to-amber-400", label: "Sarı" }')
content = content.replace('{ value: "from-sky-700 to-sky-500", label: "🔵 Mavi" }', '{ value: "from-sky-700 to-sky-500", label: "Mavi" }')
content = content.replace('{ value: "from-orange-600 to-orange-400", label: "🟠 Narıncı" }', '{ value: "from-orange-600 to-orange-400", label: "Narıncı" }')
content = content.replace('{ value: "from-red-700 to-red-500", label: "🔴 Qırmızı" }', '{ value: "from-red-700 to-red-500", label: "Qırmızı" }')
content = content.replace('{ value: "from-purple-700 to-purple-500", label: "🟣 Bənövşəyi" }', '{ value: "from-purple-700 to-purple-500", label: "Bənövşəyi" }')

# 8. Buttons, Badges and Text labels
button_replacements = [
    ('<button onClick={()=>decide(p.id,"ACTIVE")} className="btn-primary btn-xs">✓ Təsdiqlə</button>', '<button onClick={()=>decide(p.id,"ACTIVE")} className="btn-primary btn-xs flex items-center gap-1"><Icon name="check" size={12} />Təsdiqlə</button>'),
    ('<button onClick={()=>decide(p.id,"REJECTED")} className="btn-danger btn-xs">✕ Rədd et</button>', '<button onClick={()=>decide(p.id,"REJECTED")} className="btn-danger btn-xs flex items-center gap-1"><Icon name="close" size={12} />Rədd et</button>'),
    ('<button onClick={()=>approve(r.id)} className="btn-primary btn-xs">✓ Təsdiqlə</button>', '<button onClick={()=>approve(r.id)} className="btn-primary btn-xs flex items-center gap-1"><Icon name="check" size={12} />Təsdiqlə</button>'),
    ('placeholder="🌾"', 'placeholder="sprout"'),
    ('c.isActive?"✓ Aktiv":"✗ Deaktiv"', 'c.isActive ? "Aktiv" : "Deaktiv"'),
    ('<button onClick={()=>decide(r.id,"approve")} className="btn-primary btn-xs flex-1">✓ Təsdiqlə</button>', '<button onClick={()=>decide(r.id,"approve")} className="btn-primary btn-xs flex-1 flex items-center justify-center gap-1"><Icon name="check" size={12}/>Təsdiqlə</button>'),
    ('<button onClick={()=>decide(r.id,"reject")} className="btn-danger btn-xs flex-1">✗ Rədd et</button>', '<button onClick={()=>decide(r.id,"reject")} className="btn-danger btn-xs flex-1 flex items-center justify-center gap-1"><Icon name="close" size={12}/>Rədd et</button>'),
    ('{filter==="COMPLETED"?"✅ Tamamlandı":"❌ Rədd edildi"}', '{filter==="COMPLETED" ? <span className="flex items-center gap-1 text-emerald-600"><Icon name="checkCircle" size={14}/>Tamamlandı</span> : <span className="flex items-center gap-1 text-red-500"><Icon name="closeCircle" size={14}/>Rədd edildi</span>}'),
    ('<button onClick={()=>del(p.id)} className="btn-icon text-red-500">🗑</button>', '<button onClick={()=>del(p.id)} className="btn-icon text-red-500"><Icon name="trash" size={16} /></button>'),
    ('"Göndərilir...":"📤 Hamıya Göndər"', '"Göndərilir...":<span className="flex items-center gap-1"><Icon name="upload" size={16}/>Hamıya Göndər</span>'),
    ('{s.isVerified&&<span className="badge badge-green text-[10px]">✓ Verified</span>}', '{s.isVerified&&<span className="badge badge-green text-[10px] inline-flex items-center gap-1"><Icon name="check" size={10}/>Verified</span>}'),
    ('<p className="text-xs text-gray-600 mt-0.5">👤 {s.owner?.fullName||"—"} {s.owner?.phone&&<span className="text-brand-600 font-medium">· {s.owner.phone}</span>}</p>', '<p className="text-xs text-gray-600 mt-0.5 inline-flex items-center gap-1"><Icon name="user" size={12}/>{s.owner?.fullName||"—"} {s.owner?.phone&&<span className="text-brand-600 font-medium">· {s.owner.phone}</span>}</p>'),
    ('{s._count&&<p className="text-xs text-gray-500 mt-1">📦 {s._count.products||0} məhsul</p>}', '{s._count&&<p className="text-xs text-gray-500 mt-1 inline-flex items-center gap-1"><Icon name="package" size={12}/>{s._count.products||0} məhsul</p>}'),
    ('<button onClick={()=>toggle(s.id,"isVerified",true)} className="btn-primary btn-xs">✓ Doğrula</button>', '<button onClick={()=>toggle(s.id,"isVerified",true)} className="btn-primary btn-xs flex items-center gap-1"><Icon name="check" size={12}/>Doğrula</button>'),
    ('{pendingCount>0&&statusFilter==="PENDING_REVIEW"&&<p className="text-xs text-amber-600 font-medium mt-0.5">⏳ {pendingCount} elan təsdiq gözləyir</p>}', '{pendingCount>0&&statusFilter==="PENDING_REVIEW"&&<p className="text-xs text-amber-600 font-medium mt-0.5 inline-flex items-center gap-1"><Icon name="clock" size={12}/>{pendingCount} elan təsdiq gözləyir</p>}'),
    ('<p className="text-xs text-gray-500 mt-0.5">👤 {p.seller?.fullName||"—"} {p.seller?.phone&&<span className="text-brand-600 font-medium">· {p.seller.phone}</span>}</p>', '<p className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1"><Icon name="user" size={12}/>{p.seller?.fullName||"—"} {p.seller?.phone&&<span className="text-brand-600 font-medium">· {p.seller.phone}</span>}</p>'),
    ('<button onClick={()=>changeStatus(p.id,"ACTIVE")} className="btn-primary btn-xs">✓ Təsdiqlə</button>', '<button onClick={()=>changeStatus(p.id,"ACTIVE")} className="btn-primary btn-xs flex items-center gap-1"><Icon name="check" size={12}/>Təsdiqlə</button>'),
    ('<button onClick={()=>changeStatus(p.id,"REJECTED")} className="btn-danger btn-xs">✗ Rədd et</button>', '<button onClick={()=>changeStatus(p.id,"REJECTED")} className="btn-danger btn-xs flex items-center gap-1"><Icon name="close" size={12}/>Rədd et</button>'),
    ('<a href={`/products/${p.slug}`} target="_blank" rel="noopener" className="btn-secondary btn-xs">👁 Bax</a>', '<a href={`/products/${p.slug}`} target="_blank" rel="noopener" className="btn-secondary btn-xs flex items-center gap-1"><Icon name="eye" size={12}/>Bax</a>'),
    ('<button onClick={()=>del(p.id)} className="btn-danger btn-xs">🗑 Sil</button>', '<button onClick={()=>del(p.id)} className="btn-danger btn-xs flex items-center gap-1"><Icon name="trash" size={12}/>Sil</button>'),
    ('{showForm?"✕ Bağla":"+ Yeni Kampaniya"}', '{showForm ? <span className="flex items-center gap-1"><Icon name="close" size={14}/>Bağla</span> : <span className="flex items-center gap-1"><Icon name="plus" size={14}/>Yeni Kampaniya</span>}'),
    ('<p className="text-xs text-gray-500">👁 {c.impressions||0} göstəriş · 🖱 {c.clicks||0} klik</p>', '<p className="text-xs text-gray-500 inline-flex items-center gap-2"><span className="inline-flex items-center gap-1"><Icon name="eye" size={12}/>{c.impressions||0} göstəriş</span> · <span className="inline-flex items-center gap-1"><Icon name="link" size={12}/>{c.clicks||0} klik</span></p>'),
    ('<button onClick={()=>deleteCampaign(c.id)} className="btn-danger btn-xs">🗑 Sil</button>', '<button onClick={()=>deleteCampaign(c.id)} className="btn-danger btn-xs flex items-center gap-1"><Icon name="trash" size={12}/>Sil</button>'),
    ('<span className={`badge ${hasCampaign?"badge-green":"badge-yellow"}`}>{hasCampaign?"✅ Aktiv kampaniya":"⚠️ Boş"}</span>', '<span className={`badge ${hasCampaign?"badge-green":"badge-yellow"} inline-flex items-center gap-1`}>{hasCampaign?<><Icon name="checkCircle" size={12}/>Aktiv kampaniya</>:<><Icon name="alert" size={12}/>Boş</>}</span>'),
    ('emoji: "🌱"', 'emoji: "sprout"'),
    ('placeholder="Etiket (məs: 🔥 Kampaniya)"', 'placeholder="Etiket (məs: Kampaniya)"'),
    ('placeholder="Emoji (məs: 🌱)"', 'placeholder="İkon (məs: sprout)"'),
    ('<h2 className="font-bold text-lg">🎠 Slider İdarəsi</h2>', '<h2 className="font-bold text-lg flex items-center gap-2"><Icon name="image" size={20}/>Slider İdarəsi</h2>'),
    ('<h3 className="font-semibold mb-4">➕ Yeni Slide Əlavə Et</h3>', '<h3 className="font-semibold mb-4 flex items-center gap-2"><Icon name="plus" size={18}/>Yeni Slide Əlavə Et</h3>'),
    ('{slide.isActive ? "✅ Aktiv" : "⏸ Deaktiv"}', '{slide.isActive ? <span className="inline-flex items-center gap-1 text-emerald-600"><Icon name="checkCircle" size={14}/>Aktiv</span> : <span className="inline-flex items-center gap-1 text-gray-500"><Icon name="pause" size={14}/>Deaktiv</span>}'),
    ('<button onClick={() => deleteSlide(slide.id)} className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">🗑</button>', '<button onClick={() => deleteSlide(slide.id)} className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"><Icon name="trash" size={16}/></button>'),
    ('<h2 className="font-bold text-lg">📈 Analitika Paneli</h2>', '<h2 className="font-bold text-lg flex items-center gap-2"><Icon name="trendingUp" size={20}/>Analitika Paneli</h2>'),
    ('{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}', '{Array.from({length: 5}).map((_, i) => <Icon key={i} name="star" size={14} className={i < r.rating ? "fill-amber-400 text-amber-500 inline" : "text-gray-300 inline"} />)}'),
]

for old, new in button_replacements:
    if old in content:
        content = content.replace(old, new)
    else:
        print(f"WARNING: string not found: {old}")

with open("/app/tmp_work/fermer_yeni/src/components/dashboard/AdminPanel.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Process completed.")
