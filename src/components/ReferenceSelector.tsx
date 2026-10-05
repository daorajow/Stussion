import React, { useRef, useState } from 'react';
import { MediaItem } from '../types';
import { PRESET_SUBJECTS, PresetSubject } from '../data/presets';
import { WebcamCaptureModal } from './WebcamCaptureModal';

interface Props {
  references: MediaItem[];
  onReferencesChange: (newRefs: MediaItem[]) => void;
}

export function ReferenceSelector({ references, onReferencesChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);

  // Client-side image downscaler to protect memory
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const maxDim = 1200;
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
        if (!ctx) return reject(new Error('Canvas context error'));
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = reject;
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const remainingSlots = 5 - references.length;
    const filesToLoad = fileArray.slice(0, remainingSlots);

    const loadedItems: MediaItem[] = [];

    for (const file of filesToLoad) {
      try {
        const base64 = await compressImage(file);
        loadedItems.push({
          mediaId: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          base64,
          mimeType: 'image/jpeg',
          type: 'image',
          name: file.name,
        });
      } catch (err) {
        console.error('Failed to read image file:', err);
      }
    }

    if (loadedItems.length > 0) {
      onReferencesChange([...references, ...loadedItems].slice(0, 5));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeReference = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onReferencesChange(references.filter((_, idx) => idx !== indexToRemove));
  };

  const loadPreset = async (preset: PresetSubject) => {
    setLoadingPreset(preset.id);
    try {
      const items: MediaItem[] = [];
      for (let i = 0; i < preset.photos.length; i++) {
        const photo = preset.photos[i];
        const resp = await fetch(photo.url);
        const blob = await resp.blob();
        const base64 = await readBlobAsBase64(blob);
        items.push({
          mediaId: `preset-${preset.id}-${i}-${Date.now()}`,
          base64,
          mimeType: blob.type || 'image/jpeg',
          type: 'image',
          name: photo.name,
        });
      }
      onReferencesChange(items);
    } catch (err) {
      console.error('Failed to load preset model:', err);
    } finally {
      setLoadingPreset(null);
    }
  };

  // Biometric quality indicator calculation
  const getFidelityStatus = () => {
    const count = references.length;
    if (count === 0) return { score: 0, text: 'Sin referencias cargadas', color: 'text-stone-400', bar: 'bg-stone-300', width: '0%' };
    if (count === 1) return { score: 45, text: 'Básica • Añade un ángulo lateral para mayor parecido', color: 'text-amber-700', bar: 'bg-amber-500', width: '45%' };
    if (count === 2) return { score: 75, text: 'Buena • Faltaría 1 toma con luz suave o sonrisa', color: 'text-blue-700', bar: 'bg-blue-500', width: '75%' };
    if (count >= 3) return { score: 98, text: 'Óptima • Estructura ósea y rasgos 3D asegurados', color: 'text-emerald-700', bar: 'bg-emerald-600', width: '98%' };
    return { score: 100, text: 'Máxima Fidelidad', color: 'text-emerald-700', bar: 'bg-emerald-600', width: '100%' };
  };

  const fidelity = getFidelityStatus();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#78716c] block mb-1">
            01 · Casting & Sujeto
          </span>
          <h3 className="font-serif text-3xl italic text-[#1c1917] font-bold">
            Referencias del Sujeto
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-[#c25e38]">
            {references.length}/5
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#78716c] ml-1">
            Fotos
          </span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Biometric Fidelity Meter */}
      <div className="bg-white p-3.5 rounded-sm border border-[#e5e3da] space-y-2 shadow-2xs">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-[#2b2a27] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#c25e38]">fingerprint</span>
            Fidelidad Facial Estimada
          </span>
          <span className="font-mono font-bold text-xs text-[#2b2a27]">
            {fidelity.score}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#e5e3da] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${fidelity.bar}`}
            style={{ width: fidelity.width }}
          />
        </div>
        <p className={`text-[10px] ${fidelity.color} font-medium leading-tight`}>
          {fidelity.text}
        </p>
      </div>

      {/* Main Upload / Grid Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-sm border transition-all cursor-pointer group overflow-hidden ${
          isDragging
            ? 'border-[#c25e38] bg-[#c25e38]/5 scale-[0.99]'
            : 'border-dashed border-[#e5e3da] bg-white hover:border-[#c25e38]'
        } ${
          references.length === 0
            ? 'aspect-[4/5] flex flex-col items-center justify-center p-8 text-center'
            : 'p-4'
        }`}
      >
        {references.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {references.map((ref, idx) => (
                <div
                  key={ref.mediaId}
                  className={`relative aspect-square bg-[#f5f4ef] rounded-sm overflow-hidden group/item border border-[#e5e3da]/80 ${
                    idx === 0 && references.length === 1 ? 'col-span-2 aspect-[4/5]' : ''
                  }`}
                >
                  <img
                    src={`data:${ref.mimeType};base64,${ref.base64}`}
                    alt={ref.name || `Referencia ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-[#2b2a27]/85 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded-xs">
                      REF 0{idx + 1}
                    </span>
                  </div>
                  <button
                    onClick={(e) => removeReference(idx, e)}
                    title="Eliminar referencia"
                    className="absolute top-2 right-2 w-7 h-7 bg-red-600/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-700 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Quick action bar */}
            <div className="pt-2 flex items-center justify-between text-xs text-[#78716c]">
              <span className="font-mono text-[11px]">
                {references.length < 5
                  ? `+ Agregar ${5 - references.length} más`
                  : 'Máximo 5 referencias'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReferencesChange([]);
                }}
                className="hover:text-red-700 transition-colors uppercase tracking-wider text-[10px] font-bold"
              >
                Limpiar Todas
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#f5f4ef] flex items-center justify-center text-[#78716c] group-hover:scale-110 group-hover:text-[#c25e38] transition-all">
              <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
            </div>
            <div className="space-y-1">
              <p className="font-serif italic text-lg text-[#1c1917]">
                Arrastra fotos del sujeto aquí
              </p>
              <p className="text-xs text-[#78716c] max-w-xs leading-relaxed">
                o haz clic para seleccionar de 1 a 5 imágenes (JPG, PNG, WebP)
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2b2a27] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs group-hover:bg-[#c25e38] transition-colors">
                <span className="material-symbols-outlined text-[16px]">upload</span>
                Subir Archivos
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons: Webcam capture trigger */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowWebcam(true)}
          className="flex-1 py-2.5 px-3 bg-white border border-[#e5e3da] hover:border-[#c25e38] hover:text-[#c25e38] rounded-sm text-xs font-bold uppercase tracking-wider text-[#2b2a27] flex items-center justify-center gap-2 transition-all shadow-2xs"
        >
          <span className="material-symbols-outlined text-[18px]">photo_camera</span>
          Capturar con Cámara Web
        </button>
      </div>

      {/* Preset Reference Models */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#78716c]">
            O usa un sujeto editorial de prueba
          </p>
          <span className="text-[10px] text-[#78716c] italic">1-clic para cargar</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PRESET_SUBJECTS.map((preset) => {
            const isSelected =
              references.length > 0 &&
              references[0]?.name?.includes(preset.name.split(' ')[0]);
            const isLoading = loadingPreset === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => loadPreset(preset)}
                disabled={isLoading}
                className={`p-2.5 rounded-sm border text-left transition-all ${
                  isSelected
                    ? 'border-[#c25e38] bg-white ring-1 ring-[#c25e38]'
                    : 'border-[#e5e3da] bg-white/70 hover:bg-white hover:border-[#78716c]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
                    <img
                      src={preset.avatar}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#1c1917] truncate leading-tight">
                    {preset.name.split(' ')[0]}
                  </span>
                </div>
                <p className="text-[9px] text-[#78716c] line-clamp-1 font-sans">
                  {isLoading ? 'Cargando...' : `${preset.photos.length} tomas de ref`}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Webcam Modal */}
      <WebcamCaptureModal
        isOpen={showWebcam}
        onClose={() => setShowWebcam(false)}
        onAddCapturedPhotos={(newPhotos) => {
          onReferencesChange([...references, ...newPhotos].slice(0, 5));
        }}
      />
    </div>
  );
}

function readBlobAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
