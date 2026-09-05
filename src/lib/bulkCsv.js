// Shared helpers for the bulk product upload module (admin panel + farmer panel).

export const BULK_CSV_TEMPLATE =
  "titleAz,descriptionAz,price,discountedPrice,wholesalePrice,wholesaleMinQty,unit,stock,categorySlug,region,city,imageUrl\n" +
  "Evroxim KAS-32 maye azot gubresi,Yuksek effektivliqli maye azot gubresi,3.50,,2.80,10,litr,50,gubreler,Baki,Baki,\n" +
  "Bugda toxumu (sertifikasiyali),Sertifikasiyali buqda toxumu,0.85,0.75,,,kg,1000,toxumlar,Qebele,Qebele,";

export const BULK_CSV_COLUMNS = [
  { key: "titleAz", label: "Məhsul adı", required: true },
  { key: "descriptionAz", label: "Təsvir", required: false },
  { key: "price", label: "Pərakəndə qiymət (AZN)", required: true },
  { key: "discountedPrice", label: "Endirimli qiymət", required: false },
  { key: "wholesalePrice", label: "Topdan qiymət", required: false },
  { key: "wholesaleMinQty", label: "Topdan min. say", required: false },
  { key: "unit", label: "Vahid (ədəd/kq/litr)", required: false },
  { key: "stock", label: "Stok", required: false },
  { key: "categorySlug", label: "Kateqoriya (slug)", required: true },
  { key: "region", label: "Region", required: false },
  { key: "city", label: "Şəhər", required: false },
  { key: "imageUrl", label: "Şəkil URL", required: false },
];

// Minimal but correct CSV parser: handles quoted fields, escaped quotes (""),
// commas and newlines inside quotes, and CRLF line endings.
export function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;

  const src = text.replace(/^\uFEFF/, ""); // strip BOM

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cur.push(field); field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      cur.push(field); field = "";
      if (cur.some((c) => c.trim() !== "")) rows.push(cur);
      cur = [];
    } else field += ch;
  }
  cur.push(field);
  if (cur.some((c) => c.trim() !== "")) rows.push(cur);
  return rows;
}

// parseCSV → array of row objects (header row required)
export function csvToObjects(text) {
  const rows = parseCSV(text);
  if (!rows.length) throw new Error("CSV boşdur");
  const header = rows[0].map((h) => h.trim());
  const missing = ["titleAz", "price", "categorySlug"].filter((r) => !header.includes(r));
  if (missing.length) throw new Error(`CSV-də bu sütunlar çatışmır: ${missing.join(", ")}`);
  return rows.slice(1).map((cols, idx) => {
    const obj = {};
    header.forEach((h, i) => { obj[h] = (cols[i] !== undefined ? cols[i] : "").trim(); });
    obj._rowNumber = idx + 2; // +2: header line + 1-indexed
    return obj;
  });
}

export function downloadCsvTemplate() {
  const blob = new Blob(["\uFEFF" + BULK_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fermermarket-toplu-mehsul-sablon.csv";
  a.click();
  URL.revokeObjectURL(url);
}
