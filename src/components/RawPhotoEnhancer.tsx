import React, { useState, useRef } from 'react';
import { RAW_PRESETS, SKY_OPTIONS, SAMPLE_RAW_PHOTOS, SampleRawPhoto } from '../data/rawPresets';
import { GradedResultItem, WatermarkConfig } from '../types';
import { WatermarkModal } from './WatermarkModal';

interface Props {
  watermarkConfig?: WatermarkConfig;
  onUpdateWatermark?: (config: WatermarkConfig) => void;
}

export function RawPhotoEnhancer({
  watermarkConfig: initialWatermark,
  onUpdateWatermark,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawBase64, setRawBase64] = useState<string | null>(null);
  const [rawMimeType, setRawMimeType] = useState<string>('image/jpeg');
  const [rawPhotoName, setRawPhotoName] = useState<string>('');

  const [selectedPresetId, setSelectedPresetId] = useState<string>('golden-hour-romance');
  const [selectedSkyId, setSelectedSkyId] = useState<string>('none');
  const [cleanBackground, setCleanBackground] = useState<boolean>(true);
  const [enhanceLighting, setEnhanceLighting] = useState<boolean>(true);
  const [skinToneRetouch, setSkinToneRetouch] = useState<boolean>(true);
  const [customInstructions, setCustomInstructions] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<GradedResultItem | null>(null);
  const [history, setHistory] = useState<GradedResultItem[]>([]);
  const [splitSliderPos, setSplitSliderPos] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);

  // Watermark
  const [showWatermarkModal, setShowWatermarkModal] = useState<boolean>(false);
  const [watermark, setWatermark] = useState<WatermarkConfig>(
    initialWatermark || {
      enabled: false,
      text: '© Studio Session Pro',
      position: 'bottom-right',
      opacity: 0.7,
      fontStyle: 'serif',
    }
  );

  const handleUpdateWatermark = (newConfig: WatermarkConfig) => {
    setWatermark(newConfig);
    onUpdateWatermark?.(newConfig);
  };

  // Compress and read image file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processRawFile(file);
      e.target.value = '';
    }
  };

  const processRawFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const maxDim = 1600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setRawBase64(dataUrl.split(',')[1]);
        setRawMimeType('image/jpeg');
        setRawPhotoName(file.name);
        setCurrentResult(null);
      };
    };
    reader.readAsDataURL(file);
  };

  // Load sample raw photo
  const handleLoadSample = async (sample: SampleRawPhoto) => {
    try {
      const resp = await fetch(sample.url);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setRawBase64(result.split(',')[1]);
        setRawMimeType(blob.type || 'image/jpeg');
        setRawPhotoName(sample.title);
        setSelectedPresetId(sample.recommendedPreset);
        if (sample.recommendedSky) setSelectedSkyId(sample.recommendedSky);
        setCurrentResult(null);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load sample raw photo:', err);
    }
  };

  const handleProcessPhoto = async () => {
    if (!rawBase64) return;
    setIsProcessing(true);
    setError(null);

    const preset = RAW_PRESETS.find((p) => p.id === selectedPresetId) || RAW_PRESETS[0];
    const skyObj = SKY_OPTIONS.find((s) => s.id === selectedSkyId);

    try {
      const resp = await fetch('/api/grade-raw-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: rawBase64,
          mimeType: rawMimeType,
          presetName: preset.name,
          colorGradePrompt: preset.colorGradePrompt,
          selectedSkyPrompt: skyObj?.promptSnippet || '',
          customInstructions,
          cleanBackground,
          enhanceLighting,
          skinToneRetouch,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'No se pudo completar el revelado.');
      }

      const newItem: GradedResultItem = {
        id: data.id || `grade-${Date.now()}`,
        originalBase64: rawBase64,
        gradedBase64: data.gradedBase64,
        presetName: preset.name,
        mimeType: data.mimeType || 'image/png',
        timestamp: Date.now(),
        skyUsed: skyObj?.id !== 'none' ? skyObj?.label : undefined,
      };

      setCurrentResult(newItem);
      setHistory((prev) => [newItem, ...prev]);
    } catch (err: any) {
      console.error('Error grading photo:', err);
      setError(err?.message || 'Hubo un error al procesar el revelado de la fotografía.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download with optional watermark burning
  const downloadGraded = async (item: GradedResultItem) => {
    try {
      if (!watermark.enabled || !watermark.text.trim()) {
        const link = document.createElement('a');
        link.href = `data:${item.mimeType};base64,${item.gradedBase64}`;
        link.download = `Revelado_Pro_${item.presetName.replace(/\s+/g, '_')}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Draw onto canvas to burn in watermark
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `data:${item.mimeType};base64,${item.gradedBase64}`;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1600;
      canvas.height = img.naturalHeight || 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Apply watermark
      ctx.save();
      ctx.globalAlpha = watermark.opacity;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const fontSize = Math.max(24, Math.round(canvas.width * 0.024));
      const fontFam =
        watermark.fontStyle === 'serif'
          ? '"Playfair Display", Georgia, serif'
          : watermark.fontStyle === 'mono'
          ? 'monospace'
          : '"Plus Jakarta Sans", sans-serif';
      ctx.font = `italic 600 ${fontSize}px ${fontFam}`;

      const padding = Math.round(canvas.width * 0.035);

      if (watermark.position === 'bottom-right') {
        ctx.textAlign = 'right';
        ctx.fillText(watermark.text, canvas.width - padding, canvas.height - padding);
      } else if (watermark.position === 'bottom-left') {
        ctx.textAlign = 'left';
        ctx.fillText(watermark.text, padding, canvas.height - padding);
      } else if (watermark.position === 'bottom-center') {
        ctx.textAlign = 'center';
        ctx.fillText(watermark.text, canvas.width / 2, canvas.height - padding);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(watermark.text, canvas.width / 2, canvas.height / 2);
      }
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Revelado_Pro_${item.presetName.replace(/\s+/g, '_')}_Firma.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Header Banner with Watermark Trigger */}
      <div className="bg-white p-6 md:p-8 rounded-sm border border-[#e5e3da] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#c25e38] bg-[#c25e38]/10 px-2 py-0.5 rounded-2xs">
              Cuarto Oscuro Digital
            </span>
            <span className="text-xs font-mono text-[#78716c]">
              • Revelado & Color Grading Editorial
            </span>
          </div>
          <h2 className="font-serif italic text-3xl md:text-4xl text-[#1c1917] leading-tight">
            Revelado de Sesiones Reales & Pre-Boda
          </h2>
          <p className="text-sm text-[#78716c] mt-1 max-w-2xl leading-relaxed">
            Sube tus tomas crudas de pre-boda o eventos. Aplica etalonaje cinematográfico,
            reemplazo de cielo con relighting y limpieza de fondo manteniendo la identidad exacta de la pareja.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <button
            onClick={() => setShowWatermarkModal(true)}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              watermark.enabled
                ? 'bg-[#2b2a27] text-white border-[#2b2a27]'
                : 'bg-white border-[#e5e3da] text-[#78716c] hover:text-[#1c1917]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">branding_watermark</span>
            {watermark.enabled ? 'Firma Activa ✓' : 'Configurar Firma'}
          </button>

          {rawBase64 && (
            <button
              onClick={() => {
                setRawBase64(null);
                setCurrentResult(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-[#e5e3da] hover:bg-[#f5f4ef] rounded-full text-xs font-bold uppercase tracking-wider text-[#78716c] hover:text-[#1c1917] transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
              Cambiar Foto
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!rawBase64 ? (
            /* Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#e5e3da] hover:border-[#c25e38] bg-white rounded-sm aspect-[4/3] md:aspect-[16/11] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all group shadow-2xs"
            >
              <div className="w-16 h-16 rounded-full bg-[#f5f4ef] flex items-center justify-center text-[#78716c] group-hover:scale-110 group-hover:text-[#c25e38] transition-all mb-4">
                <span className="material-symbols-outlined text-4xl">cloud_upload</span>
              </div>
              <h3 className="font-serif italic text-2xl text-[#1c1917] mb-1">
                Sube tu fotografía cruda
              </h3>
              <p className="text-xs text-[#78716c] max-w-sm mb-4 leading-relaxed">
                Toma de pre-boda, retrato de pareja o evento. Formatos JPG, PNG o WebP en alta
                resolución.
              </p>
              <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2b2a27] text-white text-xs font-bold uppercase tracking-widest rounded-full group-hover:bg-[#c25e38] transition-colors shadow-xs">
                <span className="material-symbols-outlined text-[18px]">photo_library</span>
                Explorar Archivos
              </span>
            </div>
          ) : currentResult ? (
            /* Interactive Before / After Split Slider */
            <div className="space-y-3">
              <div className="relative aspect-[4/3] md:aspect-[16/11] bg-black rounded-sm overflow-hidden select-none border border-black shadow-2xl">
                {/* Graded Image (Background) */}
                <img
                  src={`data:${currentResult.mimeType};base64,${currentResult.gradedBase64}`}
                  alt="Revelado Editorial"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                  {currentResult.skyUsed && (
                    <span className="bg-sky-900/90 text-white text-[9px] font-mono px-2 py-1 rounded-2xs uppercase">
                      ☁ {currentResult.skyUsed}
                    </span>
                  )}
                  <span className="bg-[#c25e38]/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-2xs uppercase tracking-wider shadow-sm">
                    Revelado • {currentResult.presetName}
                  </span>
                </div>

                {/* Raw Image (Clipped Foreground) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - splitSliderPos}% 0 0)` }}
                >
                  <img
                    src={`data:image/jpeg;base64,${currentResult.originalBase64}`}
                    alt="Foto Cruda Original"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span className="absolute top-4 left-4 bg-[#2b2a27]/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-2xs uppercase tracking-wider z-10 shadow-sm">
                    Toma Cruda Original
                  </span>
                </div>

                {/* Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  style={{ left: `${splitSliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-[#2b2a27] shadow-xl flex items-center justify-center font-bold text-xs">
                    ↔
                  </div>
                </div>

                {/* Invisible Range Input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={splitSliderPos}
                  onChange={(e) => setSplitSliderPos(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
                />
              </div>

              {/* Slider instruction & actions */}
              <div className="flex items-center justify-between text-xs text-[#78716c] px-1">
                <span className="font-mono text-[11px]">
                  Arrastra el deslizador para comparar el revelado
                </span>
                <button
                  onClick={() => downloadGraded(currentResult)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#c25e38] text-white hover:bg-[#a64d2b] rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Descargar Foto Revelada {watermark.enabled ? '(con Firma)' : '(HD)'}
                </button>
              </div>
            </div>
          ) : (
            /* Selected Photo Preview */
            <div className="relative aspect-[4/3] md:aspect-[16/11] bg-black rounded-sm overflow-hidden border border-[#e5e3da] shadow-md group">
              <img
                src={`data:${rawMimeType};base64,${rawBase64}`}
                alt="Foto cruda cargada"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-[#2b2a27]/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-2xs uppercase">
                {rawPhotoName || 'Fotografía Cruda Cargada'}
              </div>

              {isProcessing && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 space-y-4">
                  <div className="w-16 h-16 rounded-full border-2 border-white/20 border-t-[#c25e38] animate-spin flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-[#c25e38]">
                      camera_enhance
                    </span>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-serif italic text-2xl">Aplicando Etalonaje Editorial...</p>
                    <p className="text-[11px] uppercase font-mono tracking-widest text-white/70">
                      {selectedSkyId !== 'none'
                        ? 'Reemplazando cielo y relocalizando iluminación...'
                        : 'Relighting atmosférico y balance de tonos'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sample Pre-Wedding Photos */}
          <div className="bg-white/80 p-4 rounded-sm border border-[#e5e3da] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#78716c]">
                O prueba con una toma cruda de ejemplo:
              </span>
              <span className="text-[10px] text-[#78716c] italic">1-clic para cargar</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {SAMPLE_RAW_PHOTOS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleLoadSample(sample)}
                  className="p-2 border border-[#e5e3da] hover:border-[#c25e38] rounded-sm bg-white text-left transition-all group flex items-center gap-2.5"
                >
                  <div className="w-10 h-10 rounded-xs overflow-hidden bg-stone-200 shrink-0">
                    <img
                      src={sample.url}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1c1917] truncate leading-tight">
                      {sample.title}
                    </p>
                    <p className="text-[9px] text-[#78716c] line-clamp-1 mt-0.5">
                      {sample.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Master Grading Controls */}
        <div className="lg:col-span-5 bg-white p-6 rounded-sm border border-[#e5e3da] space-y-6 shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#c25e38]">
              Configuración de Revelado
            </span>
            <h3 className="font-serif italic text-2xl text-[#1c1917] mt-0.5">
              Estilo & Presets de Etalonaje
            </h3>
            <p className="text-xs text-[#78716c] mt-1">
              Selecciona el perfil de colorimetría para transformar la atmósfera de la foto.
            </p>
          </div>

          {/* Preset Selector Grid */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917]">
              1. Preset de Fotografía Profesional
            </label>
            <div className="space-y-2">
              {RAW_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`w-full p-3 rounded-sm border text-left transition-all ${
                      isSelected
                        ? 'border-[#c25e38] bg-[#c25e38]/5 ring-1 ring-[#c25e38] shadow-xs'
                        : 'border-[#e5e3da] hover:border-[#78716c] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-[#1c1917]">{preset.name}</p>
                      <div className="flex gap-1">
                        {preset.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono px-1.5 py-0.5 bg-[#f5f4ef] text-[#78716c] rounded-2xs"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#78716c] leading-snug">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sky & Atmosphere Doctor */}
          <div className="space-y-2 pt-2 border-t border-[#e5e3da]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-sky-600">cloud</span>
                <span>2. Reemplazo de Cielo & Clima (Sky Doctor)</span>
              </label>
              {selectedSkyId !== 'none' && (
                <button
                  onClick={() => setSelectedSkyId('none')}
                  className="text-[10px] text-[#c25e38] hover:underline"
                >
                  Restablecer
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SKY_OPTIONS.map((sky) => {
                const isSelected = selectedSkyId === sky.id;
                return (
                  <button
                    key={sky.id}
                    onClick={() => setSelectedSkyId(sky.id)}
                    className={`p-2.5 rounded-sm border text-left transition-all ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/60 ring-1 ring-sky-600 shadow-2xs'
                        : 'border-[#e5e3da] hover:border-[#78716c] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c1917] mb-0.5">
                      <span className="material-symbols-outlined text-[15px] text-sky-600">
                        {sky.icon}
                      </span>
                      <span className="truncate">{sky.label}</span>
                    </div>
                    <p className="text-[9px] text-[#78716c] line-clamp-1 leading-tight">
                      {sky.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photographer Studio Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-[#e5e3da]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917]">
              3. Ajustes de Retoque Fotográfico
            </label>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 p-2.5 border border-[#e5e3da] rounded-sm bg-[#f5f4ef]/40 cursor-pointer hover:bg-[#f5f4ef]">
                <input
                  type="checkbox"
                  checked={cleanBackground}
                  onChange={(e) => setCleanBackground(e.target.checked)}
                  className="rounded text-[#c25e38] focus:ring-[#c25e38]"
                />
                <div className="flex-1">
                  <p className="font-bold text-[#2b2a27]">Limpieza y Bokeh de Fondo</p>
                  <p className="text-[10px] text-[#78716c]">
                    Elimina distracciones u objetos no deseados con desenfoque óptico natural.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 border border-[#e5e3da] rounded-sm bg-[#f5f4ef]/40 cursor-pointer hover:bg-[#f5f4ef]">
                <input
                  type="checkbox"
                  checked={enhanceLighting}
                  onChange={(e) => setEnhanceLighting(e.target.checked)}
                  className="rounded text-[#c25e38] focus:ring-[#c25e38]"
                />
                <div className="flex-1">
                  <p className="font-bold text-[#2b2a27]">Relighting Atmosférico</p>
                  <p className="text-[10px] text-[#78716c]">
                    Añade luz de recorte dorada y contraste suave en el sujeto.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 border border-[#e5e3da] rounded-sm bg-[#f5f4ef]/40 cursor-pointer hover:bg-[#f5f4ef]">
                <input
                  type="checkbox"
                  checked={skinToneRetouch}
                  onChange={(e) => setSkinToneRetouch(e.target.checked)}
                  className="rounded text-[#c25e38] focus:ring-[#c25e38]"
                />
                <div className="flex-1">
                  <p className="font-bold text-[#2b2a27]">Gradación de Tono de Piel</p>
                  <p className="text-[10px] text-[#78716c]">
                    Suaviza sombras duras conservando el 100% de la textura de poros real.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Specific Custom Note */}
          <div className="space-y-1.5 pt-2 border-t border-[#e5e3da]">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917]">
              4. Nota Específica del Fotógrafo (Opcional)
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ej: Dar calidez extra al vestido blanco y tonos miel al cielo..."
              className="w-full text-xs p-2.5 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38]"
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleProcessPhoto}
              disabled={!rawBase64 || isProcessing}
              className={`w-full py-4 rounded-full font-bold uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2 ${
                !rawBase64 || isProcessing
                  ? 'bg-[#e5e3da] text-[#78716c] cursor-not-allowed'
                  : 'bg-[#c25e38] text-white hover:bg-[#a64d2b] shadow-xl shadow-[#c25e38]/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isProcessing ? 'sync' : 'auto_awesome'}
              </span>
              {isProcessing
                ? 'Revelando Fotografía...'
                : !rawBase64
                ? 'Sube una Foto para Comenzar'
                : 'Revelar con Preset Profesional'}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-sm border border-red-200">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 1 && (
        <div className="bg-white p-6 rounded-sm border border-[#e5e3da] space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif italic text-xl text-[#1c1917]">
              Historial de Revelados de la Sesión
            </h4>
            <span className="text-xs font-mono text-[#78716c]">
              {history.length} tomas procesadas
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => setCurrentResult(item)}
                className="cursor-pointer group relative aspect-[4/3] rounded-sm overflow-hidden border border-[#e5e3da] hover:border-[#c25e38] transition-all"
              >
                <img
                  src={`data:${item.mimeType};base64,${item.gradedBase64}`}
                  alt={item.presetName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 p-2.5 flex flex-col justify-end text-white">
                  <p className="text-xs font-bold leading-tight">{item.presetName}</p>
                  <p className="text-[9px] text-white/70 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watermark Configuration Modal */}
      <WatermarkModal
        isOpen={showWatermarkModal}
        onClose={() => setShowWatermarkModal(false)}
        config={watermark}
        onChange={handleUpdateWatermark}
      />
    </div>
  );
}
