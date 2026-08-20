"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import SafeImage from "@/components/SafeImage";
import { Link } from "@/i18n/routing";
import { apiFetch, getUser } from "@/lib/apiClient";
import toast from "react-hot-toast";

export default function AgronomPage() {
  const [activeTab, setActiveTab] = useState("ai");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Aqro Xidmətlər state
  const [selectedService, setSelectedService] = useState(null);
  const [requests, setRequests] = useState([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [form, setForm] = useState({
    farmLocation: "",
    cropType: "",
    area: "",
    notes: "",
    contactPhone: "",
  });

  const user = getUser();

  useEffect(() => {
    if (user && activeTab === "services") {
      apiFetch("/api/agro-services")
        .then((data) => setRequests(data.services || []))
        .catch(() => { });
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (!selectedService) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedService]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = typeof file.type === "string" && file.type.startsWith("image/");
    const maxSize = 5 * 1024 * 1024; // 5MB
    const isValidSize = file.size <= maxSize;

    if (!isImage || !isValidSize) {
      toast.error("Yalnız 5MB-a qədər şəkil faylı yükləyə bilərsiniz.");
      e.target.value = "";
      setImage(null);
      setPreview(null);
      setResult(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImage(file);
    setPreview(objectUrl);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!image && !text.trim()) {
      toast.error("Şəkil yükləyin və ya simptomları təsvir edin");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      if (image) formData.append("image", image);
      if (text) formData.append("text", text);

      const res = await fetch("/api/ai/agronomist", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Server xətası (${res.status})`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
    } catch (err) {
      toast.error(err.message || "Analiz zamanı xəta baş verdi");
      setResult({
        disease: "Analiz uğursuz oldu",
        confidence: "0%",
        recommendation: err.message || "Serverə qoşulmaq mümkün olmadı. Zəhmət olmasa yenidən cəhd edin.",
        products: [],
        error: true
      });
    } finally {
      setLoading(false);
    }
  };

  const services = [
    {
      type: "soil_analysis",
      title: "Torpaq Analizi",
      icon: "flask",
      desc: "Torpağın kimyəvi tərkibini və qida elementlərini analiz edin. NPK, pH, humus, mikroelementlər.",
      color: "from-amber-500 to-orange-500",
      features: ["pH və humus təyini", "NPK səviyyəsi", "Mikroelement analizi", "Gübrə tövsiyəsi"],
    },
    {
      type: "leaf_analysis",
      title: "Yarpaq Analizi",
      icon: "leaf",
      desc: "Bitki yarpaqlarının qida tərkibini analiz edin. Çatışmayan elementləri müəyyən edin.",
      color: "from-green-500 to-emerald-500",
      features: ["Qida çatışmazlığı təyini", "Mikroelement analizi", "Saralma səbəbi", "Gübrə tövsiyəsi"],
    },
    {
      type: "consultation",
      title: "Aqronom Konsultasiyası",
      icon: "user",
      desc: "Peşəkar aqronomla telefon və ya online məsləhət. Əkin planı, xəstəlik mübarizəsi, gübrə proqramı.",
      color: "from-blue-500 to-indigo-500",
      features: ["Əkin planı", "Xəstəlik mübarizəsi", "Gübrə proqramı", "Məhsuldarlıq artırıcı məsləhətlər"],
    },
  ];

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Xidmət sifarişi üçün giriş edin");
      return;
    }
    setServiceLoading(true);
    try {
      const result = await apiFetch("/api/agro-services", {
        method: "POST",
        body: JSON.stringify({
          serviceType: selectedService,
          ...form,
        }),
      });
      toast.success("Sorğunuz qeydə alındı! Aqronom sizinlə əlaqə saxlayacaq.");
      setRequests([result.service, ...requests]);
      setSelectedService(null);
      setForm({ farmLocation: "", cropType: "", area: "", notes: "", contactPhone: "" });
    } catch (err) {
      toast.error("Xəta baş verdi");
    } finally {
      setServiceLoading(false);
    }
  };

  const statusLabels = {
    PENDING: "Gözləyir",
    IN_PROGRESS: "İcrada",
    COMPLETED: "Tamamlandı",
    CANCELLED: "Ləğv edildi",
  };
  const statusColors = {
    PENDING: "bg-amber-100 text-amber-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-700 via-green-600 to-emerald-600 text-white py-12 px-4 text-center rounded-b-3xl">
        <h1 className="text-2xl md:text-4xl font-black mb-3 flex items-center justify-center gap-2">
          <Icon name="sprout" size={36} /> FermerMarket AI Aqronom
        </h1>
        <p className="text-base text-teal-50 max-w-2xl mx-auto">
          Şəkil yüklə · Xəstəliyi müəyyən et · Çatışmayan elementi göstər · Dozanı hesabla · Çiləmə vaxtını tövsiyə et · Uyğun məhsulları göstər
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-10">
        {/* Tabs */}
        <div className="bg-white rounded-2xl p-1.5 shadow-xl border border-gray-100 mb-4 flex gap-1">
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === "ai"
              ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md"
              : "text-gray-500 hover:bg-gray-50"
              }`}
          >
            <Icon name="search" size={18} strokeWidth={2.5} />
            AI Analiz
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === "services"
              ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md"
              : "text-gray-500 hover:bg-gray-50"
              }`}
          >
            <Icon name="grid" size={18} strokeWidth={2.5} />
            Aqro Xidmətlər
          </button>
        </div>

        {/* ===== AI ANALİZ TAB ===== */}
        {activeTab === "ai" && (
          <>
            <div className="bg-white rounded-3xl p-5 md:p-8 shadow-xl border border-gray-100">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Bitki şəkli yüklə
                  </label>
                  <label className="block cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <div className="border-2 border-dashed border-brand-200 rounded-2xl p-6 text-center hover:bg-brand-50 transition-colors">
                      {preview && typeof preview === "string" && preview.startsWith("blob:") ? (
                        <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-xl object-contain" />
                      ) : (
                        <>
                          <Icon name="zoomIn" size={36} strokeWidth={1.5} className="text-brand-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Şəkil seçmək üçün kliklə</p>
                          <p className="text-xs text-gray-400 mt-1">JPG, PNG · maks 5MB</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <span className="flex items-center gap-1.5"><Icon name="pencil" size={16} /> Simptomları təsvir et</span>
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Məsələn: Yarpaqlar saralıb, ləkələr var, bitki zəif böyüyür..."
                    className="w-full border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 min-h-[120px] resize-none"
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={loading || (!image && !text.trim())}
                    className="w-full mt-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Analiz edilir...
                      </>
                    ) : (
                      <>
                        <Icon name="search" size={20} strokeWidth={2.5} />
                        Analiz et
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {result && !result.error && (
              <div className="mt-6 space-y-4">
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center">
                      <Icon name="checkCircle" size={24} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">TƏSNİFAT</p>
                      <h3 className="text-lg font-bold text-gray-900">{result.disease}</h3>
                    </div>
                    <span className="ml-auto bg-brand-50 text-brand-700 text-sm font-bold px-3 py-1.5 rounded-full">
                      {result.confidence}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{result.recommendation}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {result.sprayTime && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="clock" size={18} className="text-amber-500" />
                        <h4 className="font-bold text-gray-900 text-sm">Çiləmə Vaxtı Tövsiyəsi</h4>
                      </div>
                      <p className="text-sm text-gray-600">{result.sprayTime}</p>
                    </div>
                  )}
                  {result.doseInfo && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="droplet" size={18} className="text-blue-500" />
                        <h4 className="font-bold text-gray-900 text-sm">Doza Tövsiyəsi</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">{result.doseInfo.product}</span>: {result.doseInfo.norm}
                      </p>
                    </div>
                  )}
                </div>

                {result.products && result.products.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Icon name="package" size={20} className="text-brand-600" />
                      Tövsiyə olunan məhsullar
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {result.products.map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.slug}`}
                          className="group bg-gray-50 rounded-2xl overflow-hidden hover:shadow-md transition-all border border-gray-100"
                        >
                          <div className="relative aspect-square bg-gray-100 overflow-hidden">
                            {p.coverImage ? (
                              <SafeImage src={p.coverImage} alt={p.name} fill sizes="(max-width: 768px) 45vw, 160px" className="object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Icon name="sprout" size={32} />
                              </div>
                            )}
                          </div>
                          <div className="p-2.5">
                            <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">{p.name}</p>
                            <p className="text-sm font-bold text-brand-600 mt-1">{p.price} {p.currency}</p>
                            {p.manufacturer && <p className="text-[10px] text-gray-400 mt-0.5">{p.manufacturer}</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!result && !loading && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: "search", title: "Xəstəlik müəyyənetmə", desc: "Şəkildən xəstəlik təsbiti" },
                  { icon: "droplet", title: "Çatışmayan element", desc: "Qida çatışmazlığı analizi" },
                  { icon: "package", title: "Doza hesablama", desc: "Hektar üçün doza tövsiyəsi" },
                  { icon: "clock", title: "Çiləmə vaxtı", desc: "Optimal sprey vaxtı tövsiyəsi" },
                  { icon: "tag", title: "Uyğun məhsullar", desc: "DB-dən real məhsul tövsiyəsi" },
                  { icon: "leaf", title: "Bitki qidalanması", desc: "Kompleks qidalanma məsləhəti" },
                ].map((f, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-2">
                      <Icon name={f.icon} size={20} className="text-brand-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-900">{f.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== AQRO XİDMƏTLƏR TAB ===== */}
        {activeTab === "services" && (
          <>
            <p className="text-gray-500 mb-4 text-sm">Torpaq analizi, yarpaq analizi və aqronom konsultasiyası</p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {services.map((s) => (
                <div
                  key={s.type}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                    <Icon name={s.icon} size={24} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{s.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-3">{s.desc}</p>
                  <ul className="space-y-1 mb-4">
                    {s.features.map((f, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                        <Icon name="check" size={14} className="text-brand-500" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setSelectedService(s.type)}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors active:scale-95"
                  >
                    Sorğu göndər
                  </button>
                </div>
              ))}
            </div>

            {selectedService && (
              <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 pt-20 sm:items-center sm:pt-8 bg-black/50" onClick={() => setSelectedService(null)}>
                <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <h3 className="font-bold text-lg mb-4">
                    {services.find(s => s.type === selectedService)?.title} sorğusu
                  </h3>
                  <form onSubmit={handleServiceSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Təsərrüfat ünvanı</label>
                      <input
                        type="text"
                        value={form.farmLocation}
                        onChange={(e) => setForm({ ...form, farmLocation: e.target.value })}
                        placeholder="Məs: Şəki rayonu"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Bitki növü / əkin</label>
                      <input
                        type="text"
                        value={form.cropType}
                        onChange={(e) => setForm({ ...form, cropType: e.target.value })}
                        placeholder="Məs: Taxıl, Pambıq, Tərəvəz"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Sahə (ha)</label>
                      <input
                        type="text"
                        value={form.area}
                        onChange={(e) => setForm({ ...form, area: e.target.value })}
                        placeholder="Məs: 5 ha"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Əlaqə telefonu</label>
                      <input
                        type="text"
                        value={form.contactPhone}
                        onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                        placeholder="+994..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Qeydlər</label>
                      <textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Əlavə məlumat..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400 min-h-[80px] resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedService(null)}
                        className="flex-1 bg-gray-100 text-gray-700 text-sm font-semibold py-2.5 rounded-xl"
                      >
                        İmtina
                      </button>
                      <button
                        type="submit"
                        disabled={serviceLoading}
                        className="flex-1 bg-brand-600 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-50"
                      >
                        {serviceLoading ? "Göndərilir..." : "Sorğu göndər"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {user && requests.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Mənim sorğularım</h2>
                <div className="space-y-3">
                  {requests.map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <Icon name={services.find(s => s.type === r.serviceType)?.icon || "fileText"} size={20} className="text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">
                          {services.find(s => s.type === r.serviceType)?.title || r.serviceType}
                        </p>
                        <p className="text-xs text-gray-400">
                          {r.farmLocation} {r.cropType && `· ${r.cropType}`} {r.area && `· ${r.area}`}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColors[r.status] || statusColors.PENDING}`}>
                        {statusLabels[r.status] || r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
