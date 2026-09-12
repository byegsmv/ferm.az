'use client';

import React from 'react';
import LiveHomeStudio from '@/components/admin/visual-builder/LiveHomeStudio';

// Visual System Builder — CANLI redaktor: sağdaki panel www.fermermarket.az-ın
// canlı ana səhifəsini (/?editMode=true) göstərir, buradaki hər dəyişiklik
// (mətn, şəkil, blok sırası, blok əlavə/silmə) dərhal DB-yə (DynamicBlock) yazılır
// və saytda dərhal əks olunur.
export default function VisualBuilderPage() {
  return <LiveHomeStudio />;
}
