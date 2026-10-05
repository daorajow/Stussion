interface Props {
  activeMode: 'lookbook' | 'batch-retouch' | 'raw-enhancer' | 'client-view';
  onModeChange: (mode: 'lookbook' | 'batch-retouch' | 'raw-enhancer' | 'client-view') => void;
  onInfoClick: () => void;
  onOpenPoseGuide: () => void;
  onOpenWatermark: () => void;
  onOpenImageEditor: () => void;
  watermarkEnabled?: boolean;
  onReset?: () => void;
  hasImages?: boolean;
}

export function StudioHeader({
  activeMode,
  onModeChange,
  onInfoClick,
  onOpenPoseGuide,
  onOpenWatermark,
  onOpenImageEditor,
  watermarkEnabled,
  onReset,
  hasImages,
}: Props) {
  return (
    <header className="sticky top-0 z-40 bg-[#f7f6f2]/95 backdrop-blur-md border-b border-[#e5e3da] px-6 py-3 transition-all">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Brand Logo & Editorial Kicker */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-xs bg-[#1c1917] text-[#f7f6f2] flex items-center justify-center shadow-2xs">
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-serif italic text-xl tracking-tight text-[#1c1917] leading-none font-bold">
                Studio Session
              </h1>
              <span className="text-[9px] tracking-[0.2em] text-[#78716c] uppercase font-mono">
                · Atelier Pro
              </span>
            </div>
            <span className="text-[10px] tracking-wider text-[#78716c] uppercase mt-0.5 font-medium">
              Suite de Dirección de Arte & Revelado
            </span>
          </div>
        </div>

        {/* Studio Mode Selector (Refined Monochromatic Segmented Control) */}
        <div className="flex items-center bg-stone-200/60 p-1 rounded-full border border-stone-300/60 shadow-2xs self-start lg:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => onModeChange('lookbook')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeMode === 'lookbook'
                ? 'bg-[#1c1917] text-white shadow-xs'
                : 'text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            <span>Lookbook</span>
          </button>

          <button
            onClick={() => onModeChange('batch-retouch')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeMode === 'batch-retouch'
                ? 'bg-[#1c1917] text-white shadow-xs'
                : 'text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">burst_mode</span>
            <span>Retoque en Lote</span>
          </button>

          <button
            onClick={() => onModeChange('raw-enhancer')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeMode === 'raw-enhancer'
                ? 'bg-[#1c1917] text-white shadow-xs'
                : 'text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">tune</span>
            <span>Revelado Crudas</span>
          </button>

          {hasImages && (
            <button
              onClick={() => onModeChange('client-view')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeMode === 'client-view'
                  ? 'bg-[#1c1917] text-white shadow-xs'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-[#c25e38]">favorite</span>
              <span>Portal Clientes</span>
            </button>
          )}
        </div>

        {/* Tools Actions: Studio Tools cluster */}
        <div className="flex items-center gap-1.5 self-end lg:self-auto">
          <button
            onClick={onOpenImageEditor}
            title="Crear o Editar Imágenes con IA (gemini-3.1-flash-image-preview)"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white bg-[#c25e38] hover:bg-[#a64d2b] px-3.5 py-1.5 rounded-full shadow-2xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
            <span className="hidden sm:inline">Laboratorio IA</span>
          </button>

          <button
            onClick={onOpenPoseGuide}
            title="Guía de Poses de Pareja para el Terreno"
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#57534e] hover:text-[#1c1917] bg-white border border-[#e5e3da] px-3 py-1.5 rounded-full shadow-2xs hover:border-[#78716c] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px] text-[#c25e38]">menu_book</span>
            <span className="hidden sm:inline">Poses</span>
          </button>

          <button
            onClick={onOpenWatermark}
            title="Configurar Marca de Agua / Firma"
            className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-2xs transition-all border cursor-pointer ${
              watermarkEnabled
                ? 'bg-[#1c1917] text-white border-[#1c1917]'
                : 'bg-white text-[#57534e] border-[#e5e3da] hover:border-[#78716c]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">branding_watermark</span>
            <span className="hidden sm:inline">{watermarkEnabled ? 'Firma ✓' : 'Firma'}</span>
          </button>

          {onReset && activeMode === 'lookbook' && (
            <button
              onClick={onReset}
              title="Nueva Sesión"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-[#e5e3da] hover:border-[#78716c] text-[#78716c] hover:text-[#1c1917] transition-all shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
            </button>
          )}

          <button
            onClick={onInfoClick}
            title="Guía del Estudio Pro"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#e5e3da] hover:border-[#78716c] text-[#78716c] hover:text-[#1c1917] shadow-2xs shrink-0 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">info</span>
          </button>
        </div>
      </div>
    </header>
  );
}
