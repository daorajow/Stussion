import { useState } from 'react';
import { POSE_GUIDE_CARDS } from '../data/poseGuideData';
import { PoseGuideCard } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectPoseToStudio?: (prompt: string, title: string) => void;
}

export function PoseGuideModal({ isOpen, onClose, onSelectPoseToStudio }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCards =
    selectedCategory === 'all'
      ? POSE_GUIDE_CARDS
      : POSE_GUIDE_CARDS.filter((c) => c.category === selectedCategory);

  const handleCopyCue = (card: PoseGuideCard) => {
    navigator.clipboard.writeText(`${card.title}: ${card.cueForCouple}`);
    setCopiedId(card.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#2b2a27]/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#f5f4ef] rounded-sm max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-[#e5e3da] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e3da] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#c25e38] bg-[#c25e38]/10 px-2 py-0.5 rounded-2xs">
                Cheatsheet de Terreno
              </span>
              <span className="text-xs font-mono text-[#78716c]">
                • Dirección de Parejas & Parámetros
              </span>
            </div>
            <h3 className="font-serif italic text-2xl md:text-3xl text-[#1c1917]">
              Guía de Poses & Dirección para Sesiones Reales
            </h3>
            <p className="text-xs text-[#78716c] mt-0.5">
              Instrucciones verbales (cues) para desbloquear a la pareja y ajustes ópticos de cámara recomendados.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#e5e3da] flex items-center justify-center text-[#78716c] hover:text-[#1c1917] self-end md:self-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 bg-[#f5f4ef] border-b border-[#e5e3da] flex gap-2 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'Todas las Poses' },
            { id: 'romance', label: 'Romance & Conexión' },
            { id: 'walking', label: 'En Movimiento' },
            { id: 'intimate', label: 'Abrazos Íntimos' },
            { id: 'editorial', label: 'Editorial & Velo' },
            { id: 'detail', label: 'Detalles & Anillos' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#2b2a27] text-white shadow-xs'
                  : 'bg-white text-[#78716c] border border-[#e5e3da] hover:text-[#1c1917]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[65vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCards.map((card) => {
              const isCopied = copiedId === card.id;

              return (
                <div
                  key={card.id}
                  className="bg-white p-5 rounded-sm border border-[#e5e3da] shadow-2xs hover:border-[#c25e38] transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif italic text-xl font-bold text-[#1c1917]">
                        {card.title}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#f5f4ef] text-[#78716c] rounded-2xs uppercase">
                        {card.category}
                      </span>
                    </div>

                    {/* Verbal Cue for Couple */}
                    <div className="p-3 bg-[#c25e38]/5 border-l-2 border-[#c25e38] rounded-xs space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#c25e38] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">record_voice_over</span>
                        Qué decirle a la pareja:
                      </p>
                      <p className="text-xs text-[#2b2a27] italic font-serif leading-relaxed">
                        {card.cueForCouple}
                      </p>
                    </div>

                    {/* Camera Specs Box */}
                    <div className="space-y-1.5 pt-1 text-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#78716c] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">camera</span>
                        Parámetros de Cámara Óptimos:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#f5f4ef] p-2.5 rounded-xs border border-[#e5e3da]/80">
                        <div>
                          <span className="text-[#78716c]">Lente: </span>
                          <span className="text-[#1c1917] font-bold">{card.cameraSettings.lens}</span>
                        </div>
                        <div>
                          <span className="text-[#78716c]">Apertura: </span>
                          <span className="text-[#1c1917] font-bold">{card.cameraSettings.aperture}</span>
                        </div>
                        <div>
                          <span className="text-[#78716c]">Velocidad: </span>
                          <span className="text-[#1c1917] font-bold">{card.cameraSettings.shutter}</span>
                        </div>
                        <div>
                          <span className="text-[#78716c]">Sensibilidad: </span>
                          <span className="text-[#1c1917] font-bold">{card.cameraSettings.iso}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-[#78716c] italic mt-1">
                        💡 Luz: {card.cameraSettings.lighting}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#e5e3da] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopyCue(card)}
                      className="flex items-center gap-1.5 text-xs text-[#57534e] hover:text-[#1c1917] font-bold uppercase tracking-wider"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isCopied ? 'check' : 'content_copy'}
                      </span>
                      {isCopied ? 'Copiado al portapapeles' : 'Copiar Instrucción'}
                    </button>

                    {onSelectPoseToStudio && (
                      <button
                        onClick={() => {
                          onSelectPoseToStudio(card.prompt, card.title);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-[#2b2a27] hover:bg-[#c25e38] text-white text-[11px] font-bold uppercase tracking-wider rounded-full transition-all"
                      >
                        Llevar al Estudio IA →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
