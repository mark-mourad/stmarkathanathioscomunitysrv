import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface BarcodeDisplayProps {
  value: string;
  label?: string;
}

export function BarcodeDisplay({ value, label }: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 16,
          margin: 10,
          background: "transparent",
        });
      } catch {
        // fallback: render raw value text
      }
    }
  }, [value]);

  async function handleDownload() {
    if (!wrapperRef.current) return;
    try {
      const dataUrl = await toPng(wrapperRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `barcode-${value}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("تم تحميل الباركود");
    } catch {
      toast.error("فشل تحميل الباركود");
    }
  }

  if (!value) return null;

  return (
    <div className="paper-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="display text-lg">{label ?? "الباركود"}</h3>
        <button
          type="button"
          onClick={handleDownload}
          className="chip-dark px-4 py-2 text-sm flex items-center gap-2"
        >
          <Download size={16} /> تحميل الباركود (PNG)
        </button>
      </div>
      <div ref={wrapperRef} className="flex justify-center bg-white rounded-xl p-4">
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
