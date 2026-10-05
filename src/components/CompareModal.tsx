import { useState } from 'react';
import { MediaItem } from '../types';

interface Props {
  generatedImage: MediaItem | null;
  references: MediaItem[];
  onClose: () => void;
}

export function CompareModal({ generatedImage, references, onClose }: Props) {
  const [selectedRefIndex, setSelectedRefIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side'>('split');

  if (!generatedImage || references.length === 0) return null;

  const currentRef = references[selectedRefIndex] || references[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#2b2a27]/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#f5f4ef] rounded-sm max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-[#e5e3da] flex flex-col"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#e5e3da] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#c25e38]">compare</span>
            <div>
              <h3 className="font-serif italic text-xl text-[#1c1917] leading-none">
                Comparador de Fidelidad Facial
              </h3>
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#78716c] mt-1">
                Referencia Original vs. Toma Editorial IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-[#e5e3da] rounded-full p-0.5 flex text-xs">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'split'
                    ? 'bg-[#2b2a27] text-white shadow-xs'
                    : 'text-[#78716c] hover:text-[#1c1917]'
                }`}
              >
                Split Slider
              </button>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'side-by-side'
                    ? 'bg-[#2b2a27] text-white shadow-xs'
                    : 'text-[#78716c] hover:text-[#1c1917]'
                }`}
              >
                Lado a Lado
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#e5e3da] flex items-center justify-center text-[#78716c] hover:text-[#1c1917]"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 bg-[#1c1917] relative overflow-hidden flex items-center justify-center min-h-[420px] md:min-h-[500px]">
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-2 w-full h-full max-w-4xl p-4 gap-4 items-center">
              {/* Reference */}
              <div className="relative aspect-[4/5] bg-black/40 rounded-sm overflow-hidden border border-white/10 flex items-center justify-center">
                <img
                  src={`data:${currentRef.mimeType};base64,${currentRef.base64}`}
                  alt="Referencia"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-[#2b2a27]/90 text-white text-[10px] font-mono px-2 py-0.5 rounded-xs uppercase">
                  Referencia 0{selectedRefIndex + 1}
                </span>
              </div>

              {/* Generated */}
              <div className="relative aspect-[4/5] bg-black/40 rounded-sm overflow-hidden border border-[#c25e38]/50 flex items-center justify-center">
                <img
                  src={`data:${generatedImage.mimeType};base64,${generatedImage.base64}`}
                  alt="Generada"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-[#c25e38] text-white text-[10px] font-mono px-2 py-0.5 rounded-xs uppercase">
                  Editorial Nano Banana
                </span>
              </div>
            </div>
          ) : (
            /* Split Interactive Slider */
            <div className="relative aspect-[4/5] h-[72vh] max-h-[580px] bg-black select-none overflow-hidden rounded-sm border border-white/20">
              {/* Generated Image (Background) */}
              <img
                src={`data:${generatedImage.mimeType};base64,${generatedImage.base64}`}
                alt="Editorial IA"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span className="absolute top-4 right-4 bg-[#c25e38]/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-xs uppercase z-10">
                Resultado Editorial
              </span>

              {/* Reference Image (Foreground Clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={`data:${currentRef.mimeType};base64,${currentRef.base64}`}
                  alt="Referencia"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 bg-[#2b2a27]/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-xs uppercase z-10">
                  Referencia Sujeto
                </span>
              </div>

              {/* Divider Line & Handle */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-white cursor-ew-resize z-20"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-[#2b2a27] shadow-xl flex items-center justify-center font-bold text-xs pointer-events-none">
                  ↔
                </div>
              </div>

              {/* Invisible Range Slider for Smooth Drag */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
              />
            </div>
          )}
        </div>

        {/* Footer Bar & Reference Selector */}
        <div className="p-4 md:p-6 bg-white flex flex-col md:flex-row items-center justify-between gap-4 border-t border-[#e5e3da]">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716c]">
              Comparar con otra referencia:
            </span>
            <div className="flex gap-2">
              {references.map((ref, idx) => (
                <button
                  key={ref.mediaId || idx}
                  onClick={() => setSelectedRefIndex(idx)}
                  className={`w-10 h-10 rounded-sm overflow-hidden border transition-all ${
                    idx === selectedRefIndex
                      ? 'border-[#c25e38] ring-2 ring-[#c25e38]/30 scale-105'
                      : 'border-[#e5e3da] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={`data:${ref.mimeType};base64,${ref.base64}`}
                    alt={`Ref ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-[#78716c] font-mono text-center md:text-right">
            Preserva la estructura ósea, ojos, nariz y labios de la referencia original.
          </div>
        </div>
      </div>
    </div>
  );
}
