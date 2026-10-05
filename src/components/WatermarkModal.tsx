import { WatermarkConfig } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: WatermarkConfig;
  onChange: (newConfig: WatermarkConfig) => void;
}

export function WatermarkModal({ isOpen, onClose, config, onChange }: Props) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#2b2a27]/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#f5f4ef] rounded-sm max-w-lg w-full border border-[#e5e3da] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e3da] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#c25e38]">branding_watermark</span>
            <h3 className="font-serif italic text-xl text-[#1c1917]">
              Firma y Marca de Agua del Fotógrafo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#e5e3da] flex items-center justify-center text-[#78716c] hover:text-[#1c1917]"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="p-6 bg-[#1c1917] flex items-center justify-center relative min-h-[220px]">
          <div className="relative aspect-[16/10] w-full max-w-sm bg-stone-800 rounded-xs overflow-hidden shadow-inner flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop"
              alt="Preview"
              className="w-full h-full object-cover opacity-80"
            />

            {config.enabled && (
              <div
                className={`absolute pointer-events-none p-3 select-none ${
                  config.position === 'bottom-right'
                    ? 'bottom-2 right-2 text-right'
                    : config.position === 'bottom-left'
                    ? 'bottom-2 left-2 text-left'
                    : config.position === 'bottom-center'
                    ? 'bottom-2 inset-x-0 text-center'
                    : 'inset-0 flex items-center justify-center text-center'
                }`}
                style={{ opacity: config.opacity }}
              >
                <p
                  className={`text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight ${
                    config.fontStyle === 'serif'
                      ? 'font-serif italic text-base'
                      : config.fontStyle === 'mono'
                      ? 'font-mono text-xs uppercase tracking-widest'
                      : 'font-sans text-xs font-bold uppercase tracking-wider'
                  }`}
                >
                  {config.text || '© Tu Nombre Fotografía'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-5 bg-white overflow-y-auto">
          {/* Toggle Enable */}
          <div className="flex items-center justify-between pb-3 border-b border-[#e5e3da]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#1c1917]">
                Activar Marca de Agua en Descargas
              </p>
              <p className="text-[10px] text-[#78716c]">
                Estampa automáticamente tu firma en las fotos descargadas.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c25e38]"></div>
            </label>
          </div>

          {/* Text Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917]">
              Texto de Autoría o Estudio:
            </label>
            <input
              type="text"
              value={config.text}
              onChange={(e) => onChange({ ...config, text: e.target.value })}
              placeholder="Ej: © Alejandro Ruiz Fotografía"
              className="w-full text-xs p-2.5 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38]"
            />
          </div>

          {/* Placement */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917]">
              Posición:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'bottom-right', label: 'Inferior Der.' },
                { id: 'bottom-left', label: 'Inferior Izq.' },
                { id: 'bottom-center', label: 'Centro Abajo' },
                { id: 'center', label: 'Centro Tenue' },
              ].map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => onChange({ ...config, position: pos.id as any })}
                  className={`py-2 text-[10px] font-bold uppercase rounded-sm border transition-all ${
                    config.position === pos.id
                      ? 'bg-[#2b2a27] text-white border-[#2b2a27]'
                      : 'border-[#e5e3da] text-[#78716c] hover:border-[#78716c]'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style & Opacity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917]">
                Tipografía:
              </label>
              <select
                value={config.fontStyle}
                onChange={(e) => onChange({ ...config, fontStyle: e.target.value as any })}
                className="w-full text-xs p-2 border border-[#e5e3da] rounded-sm bg-white focus:outline-none focus:border-[#c25e38]"
              >
                <option value="serif">Playfair Serif Elegante</option>
                <option value="sans">Plus Jakarta Moderna</option>
                <option value="mono">Monospace Editorial</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917]">
                  Opacidad:
                </label>
                <span className="font-mono text-xs">{Math.round(config.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={config.opacity}
                onChange={(e) => onChange({ ...config, opacity: Number(e.target.value) })}
                className="w-full accent-[#c25e38]"
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-[#c25e38] text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-[#a64d2b] transition-all shadow-md mt-2"
          >
            Guardar Configuración de Firma
          </button>
        </div>
      </div>
    </div>
  );
}
