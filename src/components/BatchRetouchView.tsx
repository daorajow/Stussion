import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { MediaItem } from '../types';
import { AESTHETIC_PRESETS } from '../data/presets';

interface BatchItem {
  id: string;
  name: string;
  originalBase64: string;
  mimeType: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  retouchedBase64?: string;
  error?: string;
}

interface Props {
  currentAestheticId: string;
  onAddToSessionGallery: (items: MediaItem[]) => void;
  onSwitchToLookbook: () => void;
}

const SAMPLE_BATCH_IMAGES = [
  {
    name: 'RAW_0492_Model_Portrait.jpg',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'RAW_0493_Editorial_Profile.jpg',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'RAW_0494_Full_Body_Studio.jpg',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  },
];

export function BatchRetouchView({
  currentAestheticId,
  onAddToSessionGallery,
  onSwitchToLookbook,
}: Props) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(currentAestheticId || 'quiet-luxury');
  const [skinSmoothing, setSkinSmoothing] = useState<'natural' | 'soft-glam' | 'high-fashion'>('natural');
  const [lightingCorrection, setLightingCorrection] = useState<'balanced-fill' | 'dramatic-cinematic' | 'golden-glow'>('balanced-fill');
  const [customNotes, setCustomNotes] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [reviewItem, setReviewItem] = useState<BatchItem | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isZipping, setIsZipping] = useState(false);

  // Active aesthetic preset object
  const activePreset = AESTHETIC_PRESETS.find((p) => p.id === selectedPresetId) || AESTHETIC_PRESETS[0];

  // Helper to read file to base64
  const readFileAsBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const cleanBase64 = result.split(',')[1];
        resolve({ base64: cleanBase64, mimeType: file.type || 'image/jpeg' });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle uploaded files or folder
  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);
    const validImages = fileList.filter((f) => f.type.startsWith('image/'));

    if (validImages.length === 0) return;

    const newItems: BatchItem[] = [];
    for (const file of validImages) {
      try {
        const { base64, mimeType } = await readFileAsBase64(file);
        newItems.push({
          id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          originalBase64: base64,
          mimeType,
          status: 'pending',
        });
      } catch (err) {
        console.error('Error reading file:', file.name, err);
      }
    }

    setBatchQueue((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  // Load sample RAW batch for immediate demonstration
  const handleLoadSampleBatch = async () => {
    const loadedItems: BatchItem[] = [];
    for (const sample of SAMPLE_BATCH_IMAGES) {
      try {
        const res = await fetch(sample.url);
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
        loadedItems.push({
          id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: sample.name,
          originalBase64: base64,
          mimeType: blob.type || 'image/jpeg',
          status: 'pending',
        });
      } catch (err) {
        console.error('Failed to load sample image', err);
      }
    }
    setBatchQueue((prev) => [...prev, ...loadedItems]);
  };

  // Start batch processing queue
  const handleStartBatch = async () => {
    if (batchQueue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setCancelRequested(false);

    const itemsToProcess = [...batchQueue];

    for (let i = 0; i < itemsToProcess.length; i++) {
      if (cancelRequested) break;

      const item = itemsToProcess[i];
      if (item.status === 'done') continue;

      // Update status to processing
      setBatchQueue((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'processing' } : it))
      );

      try {
        const res = await fetch('/api/batch-beauty-pass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: item.originalBase64,
            mimeType: item.mimeType,
            presetName: activePreset.label,
            presetAesthetic: activePreset.promptSnippet,
            skinSmoothing,
            lightingCorrection,
            colorGrading: activePreset.description,
            customNotes,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al procesar retoque');

        setBatchQueue((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'done',
                  retouchedBase64: data.retouchedBase64,
                }
              : it
          )
        );
      } catch (err: any) {
        console.error('Error in batch item:', item.name, err);
        setBatchQueue((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'error',
                  error: err?.message || 'Error en el modelo',
                }
              : it
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const handleStopBatch = () => {
    setCancelRequested(true);
    setIsProcessing(false);
  };

  const handleClearBatch = () => {
    if (isProcessing) return;
    setBatchQueue([]);
    setReviewItem(null);
  };

  // Add all completed items to main session gallery
  const handleAddAllToGallery = () => {
    const completed = batchQueue.filter((it) => it.status === 'done' && it.retouchedBase64);
    if (completed.length === 0) return;

    const newMediaItems: MediaItem[] = completed.map((it, idx) => ({
      mediaId: `batch-retouch-${Date.now()}-${idx}`,
      base64: it.retouchedBase64!,
      mimeType: 'image/png',
      type: 'image',
      name: `Retoque Lote - ${it.name.replace(/\.[^/.]+$/, '')}`,
      poseLabel: 'Beauty Pass',
      aspectRatio: '4:5',
      exif: {
        cameraModel: 'Hasselblad 100MP Pro Pass',
        lens: '85mm f/1.4 Editorial Prime',
        aperture: 'f/1.8',
        shutterSpeed: '1/500s',
        iso: 'ISO 100',
        lightingSetup: `${lightingCorrection} • ${activePreset.label}`,
        photographer: 'Studio Session Batch AI',
      },
    }));

    onAddToSessionGallery(newMediaItems);
    onSwitchToLookbook();
  };

  // Download all completed items as ZIP
  const handleDownloadZip = async () => {
    const completed = batchQueue.filter((it) => it.status === 'done' && it.retouchedBase64);
    if (completed.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`Batch_Retouch_${activePreset.label.replace(/\s+/g, '_')}`);

      completed.forEach((item, index) => {
        const cleanName = item.name.replace(/\.[^/.]+$/, '');
        folder?.file(`${String(index + 1).padStart(2, '0')}_${cleanName}_BeautyPass.png`, item.retouchedBase64!, {
          base64: true,
        });
      });

      const manifest = `STUDIO SESSION PRO - REPORTE DE RETOQUE EN LOTE
Fecha: ${new Date().toLocaleString()}
Fotos Procesadas: ${completed.length}
Estilo Aplicado: ${activePreset.label} (${activePreset.promptSnippet})
Ajuste de Piel: ${skinSmoothing}
Corrección Lumínica: ${lightingCorrection}
Motor: gemini-3.1-flash-image-preview
Calidad: Píxel Fiel Editorial 100MP
`;
      folder?.file('REPORTE_RETOQUE_LOTE.txt', manifest);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lote_Retoque_BeautyPass_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const completedCount = batchQueue.filter((it) => it.status === 'done').length;
  const progressPercent = batchQueue.length > 0 ? Math.round((completedCount / batchQueue.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Hero */}
      <div className="bg-white border border-[#e5e3da] p-6 rounded-sm shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-full bg-[#c25e38] text-white">
              <span className="material-symbols-outlined text-[18px]">burst_mode</span>
            </span>
            <h2 className="font-serif italic text-2xl text-[#1c1917] font-bold">
              Retoque Masivo por Lotes (Batch AI Retouch)
            </h2>
            <span className="bg-[#2b2a27] text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase">
              AI Beauty Pass
            </span>
          </div>
          <p className="text-xs text-[#78716c] max-w-2xl leading-relaxed">
            Sube una carpeta completa o selección de fotografías crudas. La IA aplicará un pase de belleza editorial
            de alta gama (micro-textura de piel natural, corrección de iluminación y revelado de color armónico)
            basado en los presets estéticos de tu sesión.
          </p>
        </div>

        {/* Quick Session Aesthetic Indicator */}
        <div className="bg-[#f5f4ef] px-4 py-3 rounded-sm border border-[#e5e3da] shrink-0 text-right md:min-w-[200px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716c] block">
            Estética de Sesión Activa
          </span>
          <span className="font-serif italic text-sm font-bold text-[#c25e38]">
            {activePreset.label}
          </span>
          <p className="text-[10px] text-[#78716c] truncate max-w-[220px]">
            {activePreset.description}
          </p>
        </div>
      </div>

      {/* Main Grid: Left Controls & Upload / Right Queue & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 Cols): Upload & AI Beauty Pass Settings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Uploader Card */}
          <div className="bg-white p-6 rounded-sm border border-[#e5e3da] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#c25e38]">drive_folder_upload</span>
                <span>1. Cargar Fotografías Crudas</span>
              </h3>
              {batchQueue.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearBatch}
                  disabled={isProcessing}
                  className="text-[10px] text-red-600 hover:underline uppercase font-bold tracking-wider"
                >
                  Vaciar Cola
                </button>
              )}
            </div>

            {/* Hidden native file inputs */}
            <input
              ref={folderInputRef}
              type="file"
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFilesUpload}
              className="hidden"
            />
            <input
              ref={filesInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesUpload}
              className="hidden"
            />

            {/* Upload Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={isProcessing}
                className="py-3 px-3 bg-[#f5f4ef] hover:bg-stone-200 border border-[#e5e3da] rounded-sm text-xs font-bold uppercase tracking-wider text-[#2b2a27] flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer text-center"
              >
                <span className="material-symbols-outlined text-[22px] text-[#c25e38]">folder_open</span>
                <span>Subir Carpeta</span>
              </button>

              <button
                type="button"
                onClick={() => filesInputRef.current?.click()}
                disabled={isProcessing}
                className="py-3 px-3 bg-[#f5f4ef] hover:bg-stone-200 border border-[#e5e3da] rounded-sm text-xs font-bold uppercase tracking-wider text-[#2b2a27] flex flex-col items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer text-center"
              >
                <span className="material-symbols-outlined text-[22px] text-[#2b2a27]">photo_library</span>
                <span>Subir Archivos</span>
              </button>
            </div>

            {/* Test Sample Button */}
            <div className="pt-2 border-t border-[#e5e3da] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#78716c]">¿Quieres probar ahora mismo?</span>
              <button
                type="button"
                onClick={handleLoadSampleBatch}
                disabled={isProcessing}
                className="text-[11px] text-[#c25e38] hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[13px]">dataset</span>
                Cargar Lote de Muestra
              </button>
            </div>
          </div>

          {/* AI Beauty Pass Configuration */}
          <div className="bg-white p-6 rounded-sm border border-[#e5e3da] shadow-2xs space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#c25e38]">tune</span>
              <span>2. Configuración del AI Beauty Pass</span>
            </h3>

            {/* Skin Smoothing Strategy */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716c] flex items-center justify-between">
                <span>Textura de Piel (Skin Smoothing)</span>
                <span className="text-[10px] text-emerald-700 font-mono">Poro natural preservado</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'natural', label: 'Natural Editorial', desc: 'Poros 100% nítidos' },
                  { id: 'soft-glam', label: 'Soft Glamour', desc: 'Tono equilibrado' },
                  { id: 'high-fashion', label: 'Pasarela Milano', desc: 'Pómulos luminosos' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSkinSmoothing(opt.id as any)}
                    className={`p-2 rounded-sm border text-left transition-all ${
                      skinSmoothing === opt.id
                        ? 'bg-[#2b2a27] text-white border-[#2b2a27] shadow-2xs'
                        : 'border-[#e5e3da] text-[#78716c] hover:border-[#78716c] bg-[#f5f4ef]'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider">{opt.label}</div>
                    <div className={`text-[9px] mt-0.5 ${skinSmoothing === opt.id ? 'text-stone-300' : 'text-[#78716c]'}`}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting Correction */}
            <div className="space-y-1.5 pt-2 border-t border-[#e5e3da]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716c]">
                Corrección Lumínica (Lighting Curve)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'balanced-fill', label: 'Luz Equilibrada', desc: 'Relleno suave de sombras' },
                  { id: 'dramatic-cinematic', label: 'Cinematográfico', desc: 'Claroscuro de autor' },
                  { id: 'golden-glow', label: 'Hora Dorada', desc: 'Calidez envolvente' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLightingCorrection(opt.id as any)}
                    className={`p-2 rounded-sm border text-left transition-all ${
                      lightingCorrection === opt.id
                        ? 'bg-[#c25e38] text-white border-[#c25e38] shadow-2xs'
                        : 'border-[#e5e3da] text-[#78716c] hover:border-[#78716c] bg-[#f5f4ef]'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider">{opt.label}</div>
                    <div className={`text-[9px] mt-0.5 ${lightingCorrection === opt.id ? 'text-stone-100' : 'text-[#78716c]'}`}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Color Grading Selector */}
            <div className="space-y-1.5 pt-2 border-t border-[#e5e3da]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716c]">
                Preset de Revelado de Color (Color Grading)
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="w-full text-xs p-2.5 bg-[#f5f4ef] border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38] font-medium"
              >
                {AESTHETIC_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} — {p.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Art Direction Notes */}
            <div className="space-y-1.5 pt-2 border-t border-[#e5e3da]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716c]">
                Instrucciones Adicionales para el Lote (Opcional)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Ej: Resaltar tonos cobrizos y atenuar reflejos en la frente..."
                className="w-full text-xs p-2.5 bg-[#f5f4ef] border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38]"
              />
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              {isProcessing ? (
                <button
                  type="button"
                  onClick={handleStopBatch}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">pause_circle</span>
                  <span>Detener Procesamiento del Lote</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartBatch}
                  disabled={batchQueue.length === 0}
                  className={`w-full py-3.5 rounded-full font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                    batchQueue.length === 0
                      ? 'bg-stone-200 text-[#78716c] cursor-not-allowed'
                      : 'bg-[#2b2a27] hover:bg-[#c25e38] text-white cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">auto_fix_high</span>
                  <span>
                    Procesar {batchQueue.length} Foto{batchQueue.length !== 1 ? 's' : ''} en Lote
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Batch Queue, Live Progress & Review */}
        <div className="lg:col-span-7 space-y-6">
          {/* Queue Progress Bar Header */}
          <div className="bg-white p-5 rounded-sm border border-[#e5e3da] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1c1917]">
                  Cola de Procesamiento
                </span>
                <span className="text-xs text-[#78716c] ml-2 font-mono">
                  {completedCount} de {batchQueue.length} completadas ({progressPercent}%)
                </span>
              </div>

              {completedCount > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="px-3.5 py-1.5 bg-[#f5f4ef] hover:bg-stone-200 border border-[#e5e3da] rounded-full text-xs font-bold uppercase tracking-wider text-[#2b2a27] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>{isZipping ? 'Comprimiendo...' : 'Descargar ZIP'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddAllToGallery}
                    className="px-3.5 py-1.5 bg-[#c25e38] hover:bg-[#a64d2b] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                    <span>Añadir a Galería</span>
                  </button>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#f5f4ef] h-2 rounded-full overflow-hidden border border-[#e5e3da]">
              <div
                className="bg-[#c25e38] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Queue Items Grid / List */}
          {batchQueue.length === 0 ? (
            <div className="bg-white p-12 rounded-sm border-2 border-dashed border-[#e5e3da] flex flex-col items-center justify-center text-center space-y-3">
              <span className="material-symbols-outlined text-5xl text-stone-300">
                cloud_upload
              </span>
              <p className="font-serif italic text-lg text-[#2b2a27]">
                No hay fotografías cargadas en el lote
              </p>
              <p className="text-xs text-[#78716c] max-w-sm">
                Haz clic en "Subir Carpeta" o "Subir Archivos" a la izquierda para encolar tus tomas crudas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto p-1">
              {batchQueue.map((item, idx) => {
                const isSelectedForReview = reviewItem?.id === item.id;
                const hasRetouch = item.status === 'done' && item.retouchedBase64;

                return (
                  <div
                    key={item.id}
                    onClick={() => hasRetouch && setReviewItem(item)}
                    className={`relative aspect-[4/5] bg-black rounded-xs overflow-hidden border-2 transition-all cursor-pointer group ${
                      isSelectedForReview
                        ? 'border-[#c25e38] ring-2 ring-[#c25e38]/30 scale-[1.02]'
                        : 'border-[#e5e3da] hover:border-[#78716c]'
                    }`}
                  >
                    {/* Image Thumbnail */}
                    <img
                      src={`data:${item.mimeType};base64,${hasRetouch ? item.retouchedBase64 : item.originalBase64}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      {item.status === 'pending' && (
                        <span className="bg-black/75 text-stone-300 text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase backdrop-blur-xs">
                          En cola #{idx + 1}
                        </span>
                      )}
                      {item.status === 'processing' && (
                        <span className="bg-[#c25e38] text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase flex items-center gap-1 shadow-md animate-pulse">
                          <span className="material-symbols-outlined text-[11px] animate-spin">sync</span>
                          Retocando...
                        </span>
                      )}
                      {item.status === 'done' && (
                        <span className="bg-emerald-600 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase flex items-center gap-0.5 shadow-md">
                          <span className="material-symbols-outlined text-[11px]">check</span>
                          Beauty Pass ✓
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="bg-red-600 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase">
                          Error
                        </span>
                      )}
                    </div>

                    {/* File Name Tag */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-4">
                      <p className="text-[10px] text-white font-mono truncate">{item.name}</p>
                      {hasRetouch && (
                        <p className="text-[9px] text-[#c25e38] font-bold uppercase tracking-wider">
                          Click para Comparar ↔
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Interactive Split Comparison Card for Selected Item */}
          {reviewItem && reviewItem.retouchedBase64 && (
            <div className="bg-white p-5 rounded-sm border border-[#e5e3da] shadow-lg space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif italic text-lg text-[#1c1917] font-bold">
                    Inspección de Retoque: {reviewItem.name}
                  </h4>
                  <span className="text-[10px] text-[#78716c] font-mono uppercase">
                    Piel {skinSmoothing} • Iluminación {lightingCorrection} • Estilo {activePreset.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewItem(null)}
                  className="w-7 h-7 rounded-full border border-[#e5e3da] flex items-center justify-center text-[#78716c] hover:text-[#1c1917]"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Split Comparison Viewport */}
              <div className="relative aspect-[4/5] max-h-[50vh] bg-black rounded-xs overflow-hidden select-none">
                {/* Retouched Image (Background) */}
                <img
                  src={`data:${reviewItem.mimeType};base64,${reviewItem.retouchedBase64}`}
                  alt="Retocada"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 bg-[#c25e38]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase z-10">
                  AI Beauty Pass
                </span>

                {/* Original Image (Clipped) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                >
                  <img
                    src={`data:${reviewItem.mimeType};base64,${reviewItem.originalBase64}`}
                    alt="Original RAW"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-[#2b2a27]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase z-10">
                    Original Cruda
                  </span>
                </div>

                {/* Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-[#2b2a27] shadow-xl flex items-center justify-center font-bold text-xs">
                    ↔
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#78716c]">
                <span>Desliza para ver la corrección de poros, imperfecciones e iluminación.</span>
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `data:${reviewItem.mimeType};base64,${reviewItem.retouchedBase64}`;
                    link.download = `BeautyPass_${reviewItem.name}`;
                    link.click();
                  }}
                  className="text-[#c25e38] hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  Descargar Individual
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
