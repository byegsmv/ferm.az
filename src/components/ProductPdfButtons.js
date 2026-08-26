import Icon from "@/components/ui/Icon";
import React from "react";

export default function ProductPdfButtons({ product }) {
  const hasLabel = Boolean(product.labelPdf || product.labelPdfUrl);
  const hasInstruction = Boolean(product.instructionPdf || product.instructionPdfUrl);

  if (!hasLabel && !hasInstruction) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3" data-testid="pdf-buttons-container">
      {hasLabel && (
        <a
          href={`/api/products/${product.id}/download?type=label`}
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          download
        >
          <span className="flex items-center gap-1.5"><Icon name="fileText" size={16} /> Etiketi Yüklə (PDF)</span>
        </a>
      )}
      {hasInstruction && (
        <a
          href={`/api/products/${product.id}/download?type=instruction`}
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          download
        >
          <span className="flex items-center gap-1.5"><Icon name="fileText" size={16} /> Təlimatı Yüklə (PDF)</span>
        </a>
      )}
    </div>
  );
}
