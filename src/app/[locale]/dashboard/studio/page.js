"use client";
import LiveHomeStudio from "@/components/admin/visual-builder/LiveHomeStudio";

// Bu route qorunub saxlanılır (geriyə uyğunluq) — əsl editor artıq paylaşılan
// komponentdədir (LiveHomeStudio), Admin Panel → Visual System Builder da onu göstərir.
export default function StudioPage() {
  return (
    <div className="p-3 sm:p-4">
      <LiveHomeStudio />
    </div>
  );
}
