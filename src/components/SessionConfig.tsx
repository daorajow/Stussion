import { useState } from 'react';
import { PoseType, AspectRatioType } from '../types';
import {
  AESTHETIC_PRESETS,
  LIGHTING_OPTIONS,
  CAMERA_OPTIONS,
  LOCATION_OPTIONS,
  CREATIVE_TAGS,
} from '../data/presets';

interface Props {
  poses: PoseType[];
  selectedPoses: string[];
  customDescription: string;
  selectedAesthetic: string;
  selectedLighting: string;
  selectedCamera: string;
  selectedLocation: string;
  aspectRatio: AspectRatioType;
  shotOverrides: Record<string, string>;
  onTogglePose: (id: string) => void;
  onDescriptionChange: (val: string) => void;
  onAestheticChange: (id: string) => void;
  onLightingChange: (id: string) => void;
  onCameraChange: (id: string) => void;
  onLocationChange: (id: string) => void;
  onAspectRatioChange: (ratio: AspectRatioType) => void;
  onShotOverrideChange: (poseId: string, val: string) => void;
  onStart: () => void;
  isDisabled: boolean;
  referencesCount: number;
}

export function SessionConfig({
  poses,
  selectedPoses,
  customDescription,
  selectedAesthetic,
  selectedLighting,
  selectedCamera,
  selectedLocation,
  aspectRatio,
  shotOverrides,
  onTogglePose,
  onDescriptionChange,
  onAestheticChange,
  onLightingChange,
  onCameraChange,
  onLocationChange,
  onAspectRatioChange,
  onShotOverrideChange,
  onStart,
  isDisabled,
  referencesCount,
}: Props) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeTab, setActiveTab] = useState<'collection' | 'lighting' | 'gear' | 'set'>('collection');
  const [expandedShotTune, setExpandedShotTune] = useState<string | null>(null);

  const handleMagicEnhance = async () => {
    if (!customDescription.trim()) return;
    setIsEnhancing(true);
    try {
      const resp = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawDescription: customDescription,
          aesthetic: AESTHETIC_PRESETS.find((a) => a.id === selectedAesthetic)?.label,
        }),
      });
      const data = await resp.json();
      if (data.enhanced) {
        onDescriptionChange(data.enhanced);
      }
    } catch (err) {
      console.error('Enhance error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSelectTag = (tag: string) => {
    if (!customDescription.trim()) {
      onDescriptionChange(tag);
    } else if (!customDescription.includes(tag)) {
      onDescriptionChange(`${customDescription}, ${tag}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Paso 02: Suite de Dirección Creativa */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#78716c] mb-1">
              Paso 02
            </h2>
            <h3 className="font-serif text-3xl italic text-[#1c1917]">
              Dirección Creativa y Suite de Estudio
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#c25e38] bg-[#c25e38]/10 px-2.5 py-1 rounded-sm uppercase tracking-wider font-bold">
            Nano Banana Pro
          </span>
        </div>
        <p className="text-[#78716c] text-sm mt-1 max-w-xl leading-relaxed">
          Estructura el estilismo, iluminación, atmósfera y óptica fotográfica de la sesión.
        </p>
      </div>

      {/* Selector de Pestañas Técnicas de Estudio */}
      <div className="space-y-4">
        <div className="flex border-b border-[#e5e3da] text-xs font-bold uppercase tracking-wider overflow-x-auto gap-2 pb-0.5">
          {[
            { id: 'collection', label: '1. Colección y Estilo', icon: 'style' },
            { id: 'lighting', label: '2. Iluminación de Estudio', icon: 'flare' },
            { id: 'gear', label: '3. Cámara y Película', icon: 'photo_camera' },
            { id: 'set', label: '4. Locación / Set', icon: 'apartment' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-3 flex items-center gap-1.5 transition-all whitespace-nowrap border-b-2 -mb-0.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#c25e38] text-[#c25e38]'
                  : 'border-transparent text-[#78716c] hover:text-[#2b2a27]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Colección / Estética */}
        {activeTab === 'collection' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
            {AESTHETIC_PRESETS.map((item) => (
              <button
                key={item.id}
                onClick={() => onAestheticChange(item.id)}
                className={`p-3 rounded-sm border text-left transition-all ${
                  selectedAesthetic === item.id
                    ? 'border-[#c25e38] bg-white ring-1 ring-[#c25e38] shadow-xs'
                    : 'border-[#e5e3da] bg-white/70 hover:bg-white hover:border-[#78716c]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#78716c]">
                    {item.category}
                  </span>
                  {selectedAesthetic === item.id && (
                    <span className="w-2 h-2 rounded-full bg-[#c25e38]" />
                  )}
                </div>
                <p className="text-xs font-bold text-[#1c1917]">{item.label}</p>
                <p className="text-[10px] text-[#78716c] line-clamp-2 mt-1 leading-snug">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Tab 2: Iluminación de Estudio */}
        {activeTab === 'lighting' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
            {LIGHTING_OPTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => onLightingChange(item.id)}
                className={`p-3 rounded-sm border text-left transition-all ${
                  selectedLighting === item.id
                    ? 'border-[#c25e38] bg-white ring-1 ring-[#c25e38] shadow-xs'
                    : 'border-[#e5e3da] bg-white/70 hover:bg-white hover:border-[#78716c]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[#c25e38]">
                  <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                  <span className="text-xs font-bold text-[#1c1917]">{item.label}</span>
                </div>
                <p className="text-[10px] text-[#78716c] line-clamp-2 leading-snug">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Tab 3: Cámara y Óptica */}
        {activeTab === 'gear' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
            {CAMERA_OPTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => onCameraChange(item.id)}
                className={`p-3 rounded-sm border text-left transition-all ${
                  selectedCamera === item.id
                    ? 'border-[#c25e38] bg-white ring-1 ring-[#c25e38] shadow-xs'
                    : 'border-[#e5e3da] bg-white/70 hover:bg-white hover:border-[#78716c]'
                }`}
              >
                <p className="text-xs font-bold text-[#1c1917]">{item.label}</p>
                <p className="text-[10px] text-[#78716c] mt-1 leading-snug">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Tab 4: Locación / Set */}
        {activeTab === 'set' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 animate-in fade-in duration-200">
            {LOCATION_OPTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => onLocationChange(item.id)}
                className={`p-3 rounded-sm border text-left transition-all ${
                  selectedLocation === item.id
                    ? 'border-[#c25e38] bg-white ring-1 ring-[#c25e38] shadow-xs'
                    : 'border-[#e5e3da] bg-white/70 hover:bg-white hover:border-[#78716c]'
                }`}
              >
                <p className="text-xs font-bold text-[#1c1917]">{item.label}</p>
                <p className="text-[10px] text-[#78716c] line-clamp-2 mt-1 leading-snug">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Textarea de Estilismo y Botón Mágico con IA */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
            <span>Prendas, Telas y Notas del Director:</span>
          </label>
          <button
            type="button"
            onClick={handleMagicEnhance}
            disabled={isEnhancing || !customDescription.trim()}
            className="text-[11px] font-bold text-[#c25e38] hover:text-[#a64d2b] flex items-center gap-1 bg-[#c25e38]/10 hover:bg-[#c25e38]/20 px-3 py-1 rounded-full transition-all disabled:opacity-40 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">
              {isEnhancing ? 'sync' : 'auto_fix_high'}
            </span>
            {isEnhancing ? 'Mejorando con IA...' : 'Mejorar Prompt con IA'}
          </button>
        </div>

        <div className="relative group">
          <textarea
            value={customDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Ej: Vestido de seda rojo carmín, peinado mojado hacia atrás, joyas doradas discretas, actitud desafiante..."
            className="w-full h-24 bg-white border border-[#e5e3da] p-3.5 rounded-sm text-xs focus:outline-none focus:border-[#c25e38] transition-colors resize-none placeholder:italic placeholder:text-[#78716c]/50 shadow-2xs leading-relaxed"
          />
        </div>

        {/* Quick Tag Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {CREATIVE_TAGS.map((tag, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectTag(tag)}
              className="text-[10px] bg-white border border-[#e5e3da] hover:border-[#c25e38] text-[#57534e] hover:text-[#c25e38] px-2.5 py-1 rounded-2xs transition-colors text-left"
            >
              + {tag.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de Formato / Aspect Ratio */}
      <div className="space-y-2 pt-2 border-t border-[#e5e3da]">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917]">
          Proporción de Imagen (Aspect Ratio)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: '4:5', label: '4:5 Editorial', sub: 'Instagram / Revista' },
            { id: '9:16', label: '9:16 Vertical', sub: 'Stories / TikTok' },
            { id: '1:1', label: '1:1 Cuadrado', sub: 'Lookbook E-comm' },
            { id: '16:9', label: '16:9 Cinema', sub: 'Horizontal Web' },
          ].map((ratio) => (
            <button
              key={ratio.id}
              type="button"
              onClick={() => onAspectRatioChange(ratio.id as AspectRatioType)}
              className={`p-2.5 rounded-sm border text-center transition-all ${
                aspectRatio === ratio.id
                  ? 'border-[#c25e38] bg-white text-[#c25e38] font-bold ring-1 ring-[#c25e38]'
                  : 'border-[#e5e3da] bg-white/70 hover:bg-white text-[#57534e]'
              }`}
            >
              <p className="text-xs font-mono">{ratio.label}</p>
              <p className="text-[9px] text-[#78716c] mt-0.5">{ratio.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Paso 03: Selección de Tomas & Afinación por Toma */}
      <div className="space-y-3 pt-2 border-t border-[#e5e3da]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#78716c] mb-0.5">
              Paso 03 • Tomas Editoriales
            </h2>
            <p className="text-xs text-[#78716c]">
              Selecciona tomas y personaliza detalles para cada una si lo deseas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (selectedPoses.length === poses.length) {
                onTogglePose(poses[0].id);
              } else {
                poses.forEach((p) => {
                  if (!selectedPoses.includes(p.id)) onTogglePose(p.id);
                });
              }
            }}
            className="text-[11px] font-semibold text-[#c25e38] hover:underline"
          >
            {selectedPoses.length === poses.length ? 'Deseleccionar' : 'Seleccionar Todas'}
          </button>
        </div>

        <div className="space-y-2">
          {poses.map((pose) => {
            const isSelected = selectedPoses.includes(pose.id);
            const isTuning = expandedShotTune === pose.id;
            const currentOverride = shotOverrides[pose.id] || '';

            return (
              <div
                key={pose.id}
                className={`rounded-sm border transition-all ${
                  isSelected
                    ? 'bg-white border-[#c25e38] shadow-xs'
                    : 'bg-white/60 border-[#e5e3da] hover:border-[#78716c]'
                }`}
              >
                <div
                  onClick={() => onTogglePose(pose.id)}
                  className="p-3.5 flex items-center gap-3.5 cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 flex items-center justify-center rounded-sm transition-colors shrink-0 ${
                      isSelected ? 'bg-[#c25e38] text-white' : 'bg-[#f5f4ef] text-[#78716c]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{pose.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#2b2a27]">
                      {pose.label}
                    </p>
                    <p className="text-[10px] text-[#78716c] truncate mt-0.5">
                      {currentOverride ? `Ajustado: ${currentOverride}` : pose.prompt.split(',')[0]}
                    </p>
                  </div>

                  {/* Tuning Button */}
                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedShotTune(isTuning ? null : pose.id);
                      }}
                      className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#78716c] hover:text-[#c25e38] bg-[#f5f4ef] rounded-2xs border border-[#e5e3da]"
                    >
                      {isTuning ? 'Cerrar' : 'Afinar Toma'}
                    </button>
                  )}

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#c25e38] border-[#c25e38]' : 'border-[#e5e3da]'
                    }`}
                  >
                    {isSelected && (
                      <span className="material-symbols-outlined text-[13px] text-white font-bold">
                        check
                      </span>
                    )}
                  </div>
                </div>

                {/* Per-Shot Prompt Tuning Drawer */}
                {isSelected && isTuning && (
                  <div className="p-3 bg-[#f5f4ef]/60 border-t border-[#e5e3da] space-y-2 animate-in fade-in duration-150">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#78716c]">
                      Detalle específico para {pose.label}:
                    </label>
                    <input
                      type="text"
                      value={currentOverride}
                      onChange={(e) => onShotOverrideChange(pose.id, e.target.value)}
                      placeholder={`Ej: ${
                        pose.id === 'portrait'
                          ? 'Mirada desafiante a cámara, labios color burdeos mate'
                          : pose.id === 'full-body'
                          ? 'Tacones de aguja negros y gabardina abierta'
                          : 'Acento en la joyería de oro y peinado recogido'
                      }`}
                      className="w-full text-xs p-2 border border-[#e5e3da] bg-white rounded-xs focus:outline-none focus:border-[#c25e38]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón de Generación */}
      <div className="pt-6 border-t border-[#e5e3da] flex flex-col items-center space-y-3">
        {referencesCount === 0 && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            Carga al menos 1 foto de referencia en el Paso 01 para comenzar
          </p>
        )}

        <button
          onClick={onStart}
          disabled={isDisabled}
          className={`group relative w-full md:w-auto px-12 py-4 rounded-full font-bold uppercase tracking-[0.2em] text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
            isDisabled
              ? 'bg-[#e5e3da] text-[#78716c] cursor-not-allowed'
              : 'bg-[#c25e38] text-white hover:bg-[#a64d2b] hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#c25e38]/25 cursor-pointer'
          }`}
        >
          <span>
            {isDisabled
              ? referencesCount === 0
                ? 'Sube fotos de referencia'
                : 'Selecciona al menos una toma'
              : `Generar Sesión Editorial (${selectedPoses.length} ${
                  selectedPoses.length === 1 ? 'Foto' : 'Fotos'
                })`}
          </span>
          {!isDisabled && (
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
              auto_awesome
            </span>
          )}
        </button>

        <p className="text-[10px] text-[#78716c] uppercase tracking-widest font-semibold text-center">
          Potenciado por Nano Banana Pro • Render Editorial {aspectRatio}
        </p>
      </div>
    </div>
  );
}
