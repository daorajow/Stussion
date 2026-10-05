import { useState } from 'react';
import JSZip from 'jszip';
import { MediaItem, PhotoExifData } from '../types';
import { ImageDetailModal } from './ImageDetailModal';
import { CompareModal } from './CompareModal';
import { MagazineCoverModal } from './MagazineCoverModal';
import { PhotoDetailsModal } from './PhotoDetailsModal';

interface Props {
  images: MediaItem[];
  references: MediaItem[];
  onNewSession?: () => void;
  onRegenerateShot: (img: MediaItem) => Promise<void>;
  onUpdateImageMetadata: (mediaId: string, updatedExif: PhotoExifData) => void;
  onEditWithAI?: (img: MediaItem) => void;
  onInpaintArea?: (img: MediaItem) => void;
}

export function SessionGallery({
  images,
  references,
  onNewSession,
  onRegenerateShot,
  onUpdateImageMetadata,
  onEditWithAI,
  onInpaintArea,
}: Props) {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [compareImage, setCompareImage] = useState<MediaItem | null>(null);
  const [coverImage, setCoverImage] = useState<MediaItem | null>(null);
  const [detailsImage, setDetailsImage] = useState<MediaItem | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [galleryFilter, setGalleryFilter] = useState<'normal' | 'bw' | 'portra' | 'grain'>('normal');

  // Inline Card Compare state
  const [cardCompare, setCardCompare] = useState<Record<string, {
    active: boolean;
    mode: 'slider' | 'side-by-side';
    refIndex: number;
    sliderPos: number;
  }>>({});

  const handleToggleCardCompare = (mediaId: string) => {
    setCardCompare((prev) => {
      const current = prev[mediaId];
      const nextActive = !current?.active;
      return {
        ...prev,
        [mediaId]: {
          active: nextActive,
          mode: current?.mode || 'slider',
          refIndex: current?.refIndex || 0,
          sliderPos: current?.sliderPos ?? 50,
        },
      };
    });
  };

  const handleSetCompareMode = (mediaId: string, mode: 'slider' | 'side-by-side') => {
    setCardCompare((prev) => ({
      ...prev,
      [mediaId]: {
        ...(prev[mediaId] || { active: true, refIndex: 0, sliderPos: 50 }),
        mode,
      },
    }));
  };

  const handleCycleReference = (mediaId: string) => {
    if (references.length <= 1) return;
    setCardCompare((prev) => {
      const current = prev[mediaId] || { active: true, mode: 'slider', refIndex: 0, sliderPos: 50 };
      const nextIndex = (current.refIndex + 1) % references.length;
      return {
        ...prev,
        [mediaId]: {
          ...current,
          refIndex: nextIndex,
        },
      };
    });
  };

  const handleSliderChange = (mediaId: string, pos: number) => {
    setCardCompare((prev) => ({
      ...prev,
      [mediaId]: {
        ...(prev[mediaId] || { active: true, mode: 'slider', refIndex: 0 }),
        sliderPos: pos,
      },
    }));
  };

  // Trigger browser download
  const triggerDownload = (base64: string, mimeType: string, filename: string) => {
    try {
      const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleDownloadSingle = (img: MediaItem, index: number) => {
    const filename = `Sesion_Foto_${index + 1}_${img.name.replace(/\s+/g, '_')}.jpg`;
    triggerDownload(img.base64, img.mimeType || 'image/jpeg', filename);
  };

  const handleRegenerate = async (img: MediaItem) => {
    setRegeneratingId(img.mediaId);
    try {
      await onRegenerateShot(img);
    } finally {
      setRegeneratingId(null);
    }
  };

  const downloadAll = async () => {
    setDownloadState('downloading');
    try {
      const zip = new JSZip();

      // Add references folder
      const refFolder = zip.folder('Referencias_Sujeto');
      references.forEach((ref, i) => {
        const cleanBase64 = ref.base64.replace(/^data:[^;]+;base64,/, '');
        refFolder?.file(`Referencia_0${i + 1}.jpg`, cleanBase64, { base64: true });
      });

      // Add editorial photos folder
      const editorialFolder = zip.folder('Lookbook_Editorial');
      images.forEach((img, i) => {
        const cleanBase64 = img.base64.replace(/^data:[^;]+;base64,/, '');
        editorialFolder?.file(`Sesion_Foto_0${i + 1}.jpg`, cleanBase64, { base64: true });
      });

      // Add Lookbook Manifest with full EXIF data
      const exifManifestLines = images
        .map(
          (img, idx) =>
            `TOMA ${idx + 1}: ${img.name}
  - Cámara: ${img.exif?.cameraModel || 'Hasselblad H6D-100c'}
  - Lente: ${img.exif?.lens || '85mm f/1.4 Portrait Lens'}
  - Parámetros: ${img.exif?.aperture || 'f/1.8'} • ${img.exif?.shutterSpeed || '1/500s'} • ${img.exif?.iso || 'ISO 100'}
  - Iluminación: ${img.exif?.lightingSetup || 'Studio Octabox'}`
        )
        .join('\n\n');

      zip.file(
        'EDITORIAL_LOOKBOOK_INFO.txt',
        `STUDIO SESSION AI PRO - EDITORIAL LOOKBOOK
------------------------------------------------
Fecha: ${new Date().toLocaleDateString()}
Total de tomas: ${images.length}
Motor: Nano Banana Pro (Gemini Multimodal Generation)
Aspect Ratio: ${images[0]?.aspectRatio || '4:5'} Editorial Standard
Fotografía generada con consistencia de identidad facial a partir de ${references.length} referencias.

METADATOS TÉCNICOS EXIF DE LA SESIÓN:
------------------------------------------------
${exifManifestLines}`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Lookbook_Editorial_Studio_Session.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 2500);
    } catch (err) {
      console.error('ZIP generation error:', err);
      setDownloadState('idle');
    }
  };

  return (
    <div className="space-y-10">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e5e3da]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#c25e38] bg-[#c25e38]/10 px-2 py-0.5 rounded-xs">
              Lookbook Completado
            </span>
            <span className="text-xs font-mono text-[#78716c]">
              • {images.length} tomas de alta costura
            </span>
          </div>
          <h2 className="text-[11px] uppercase font-bold tracking-[0.25em] text-[#78716c] mb-1">
            Resultado de la Sesión
          </h2>
          <h3 className="font-serif text-4xl italic leading-tight text-[#1c1917]">
            Editorial Lookbook <br />
            <span className="text-3xl text-[#57534e]">Fall / Winter Studio Collection</span>
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNewSession && (
            <button
              onClick={onNewSession}
              className="flex items-center gap-1.5 bg-white border border-[#e5e3da] px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-[#2b2a27] hover:border-[#2b2a27] transition-all shadow-2xs"
            >
              <span className="material-symbols-outlined text-[17px]">restart_alt</span>
              Nueva Sesión
            </button>
          )}

          <button
            onClick={downloadAll}
            disabled={downloadState !== 'idle'}
            className="flex items-center gap-2 bg-[#2b2a27] text-white border border-[#2b2a27] px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#c25e38] hover:border-[#c25e38] transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">
              {downloadState === 'downloading'
                ? 'sync'
                : downloadState === 'done'
                ? 'check'
                : 'download'}
            </span>
            {downloadState === 'downloading'
              ? 'Preparando ZIP...'
              : downloadState === 'done'
              ? 'Descargado ✓'
              : 'Descargar Todo (.zip)'}
          </button>
        </div>
      </div>

      {/* Filter Laboratory & Tool strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/70 p-3.5 rounded-sm border border-[#e5e3da]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#78716c] flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">tune</span>
            Filtro de Laboratorio:
          </span>
          <div className="flex gap-1.5">
            {[
              { id: 'normal', label: 'Color Natural' },
              { id: 'bw', label: 'Monocromo Noir' },
              { id: 'portra', label: 'Portra Cálido' },
              { id: 'grain', label: 'Grano 35mm' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setGalleryFilter(f.id as any)}
                className={`text-[11px] font-mono px-3 py-1 rounded-xs border transition-all ${
                  galleryFilter === f.id
                    ? 'bg-[#2b2a27] text-white border-[#2b2a27]'
                    : 'bg-white text-[#78716c] border-[#e5e3da] hover:text-[#1c1917]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* References summary badge */}
        <div className="flex items-center gap-2 text-xs text-[#78716c]">
          <span>Referencias activas:</span>
          <div className="flex -space-x-1.5">
            {references.map((r, i) => (
              <div
                key={r.mediaId || i}
                className="w-6 h-6 rounded-full overflow-hidden border-2 border-white bg-stone-200"
              >
                <img
                  src={`data:${r.mimeType};base64,${r.base64}`}
                  alt="Ref"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {images.map((img, i) => {
          const isRegenerating = regeneratingId === img.mediaId;

          return (
            <div key={img.mediaId || i} className="space-y-3 group">
              <div
                className={`relative aspect-[4/5] bg-white rounded-sm border border-[#e5e3da] overflow-hidden shadow-2xs group-hover:shadow-xl transition-all duration-500 select-none ${
                  galleryFilter === 'bw'
                    ? 'grayscale contrast-110'
                    : galleryFilter === 'portra'
                    ? 'sepia-[20%] saturate-110'
                    : galleryFilter === 'grain'
                    ? 'contrast-105'
                    : ''
                }`}
              >
                <img
                  src={`data:${img.mimeType};base64,${img.base64}`}
                  alt={`Shot ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                />

                {/* Regenerating Spinner Overlay */}
                {isRegenerating && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 space-y-2">
                    <span className="material-symbols-outlined text-3xl animate-spin text-[#c25e38]">
                      sync
                    </span>
                    <p className="text-xs font-mono uppercase tracking-wider">
                      Re-disparando toma...
                    </p>
                  </div>
                )}

                {/* Plate label badge & Compare Toggle */}
                <div className="absolute top-3.5 inset-x-3.5 z-20 flex items-center justify-between pointer-events-none">
                  {/* Clean unboxed editorial index */}
                  <div className="flex items-center gap-1.5 pointer-events-auto bg-[#1c1917]/75 backdrop-blur-md px-2.5 py-1 rounded-full text-white/90 shadow-sm border border-white/10">
                    <span className="font-mono text-[10px] tracking-widest font-bold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-white/30 text-[9px]">·</span>
                    <span className="text-[9px] uppercase tracking-wider font-mono text-stone-200">
                      {img.poseLabel || 'Toma'}
                    </span>
                    {img.exif && (
                      <>
                        <span className="text-white/30 text-[9px]">·</span>
                        <span className="text-[9px] text-[#e0825c] font-mono font-bold uppercase">EXIF</span>
                      </>
                    )}
                  </div>

                  {/* 'Compare' Toggle Button on Card */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCardCompare(img.mediaId);
                    }}
                    title="Comparar con la foto de referencia del sujeto"
                    className={`pointer-events-auto px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 backdrop-blur-md shadow-md cursor-pointer ${
                      cardCompare[img.mediaId]?.active
                        ? 'bg-[#c25e38] text-white ring-2 ring-[#c25e38]/30 scale-105'
                        : 'bg-white/95 text-[#2b2a27] hover:bg-white hover:text-[#c25e38]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {cardCompare[img.mediaId]?.active ? 'close' : 'compare'}
                    </span>
                    <span>{cardCompare[img.mediaId]?.active ? 'Cerrar' : 'Comparar'}</span>
                  </button>
                </div>

                {/* Inline Comparison Overlay (Slider or Side-by-Side) */}
                {cardCompare[img.mediaId]?.active && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 z-15 bg-black flex flex-col animate-in fade-in duration-200"
                  >
                    {references.length > 0 ? (
                      <>
                        {/* Top Control Bar inside the card */}
                        <div className="absolute top-12 inset-x-3 z-30 flex items-center justify-between bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20 text-white text-[10px] shadow-lg">
                          {/* Mode switch: Slider vs Side-by-Side */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSetCompareMode(img.mediaId, 'slider')}
                              className={`px-2 py-0.5 rounded-full font-bold uppercase transition-all ${
                                (cardCompare[img.mediaId]?.mode || 'slider') === 'slider'
                                  ? 'bg-white text-black'
                                  : 'text-stone-300 hover:text-white'
                              }`}
                            >
                              Slider ↔
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetCompareMode(img.mediaId, 'side-by-side')}
                              className={`px-2 py-0.5 rounded-full font-bold uppercase transition-all ${
                                cardCompare[img.mediaId]?.mode === 'side-by-side'
                                  ? 'bg-white text-black'
                                  : 'text-stone-300 hover:text-white'
                              }`}
                            >
                              Lado a Lado ⫴
                            </button>
                          </div>

                          {/* Reference picker (if multiple references) */}
                          {references.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleCycleReference(img.mediaId)}
                              title="Cambiar foto de referencia a comparar"
                              className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded-full font-mono text-[9px] uppercase tracking-wider text-white"
                            >
                              Ref {((cardCompare[img.mediaId]?.refIndex || 0) + 1)}/{references.length}
                            </button>
                          )}
                        </div>

                        {(cardCompare[img.mediaId]?.mode || 'slider') === 'slider' ? (
                          /* SLIDER VIEW OVERLAY */
                          <div className="relative w-full h-full overflow-hidden select-none">
                            {/* Base: AI Image */}
                            <img
                              src={`data:${img.mimeType};base64,${img.base64}`}
                              alt="AI Result"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <span className="absolute bottom-4 right-4 bg-[#c25e38]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase z-20 shadow-xs pointer-events-none">
                              Generada (IA)
                            </span>

                            {/* Top Clipped Layer: Original Reference Photo */}
                            <div
                              className="absolute inset-0 overflow-hidden pointer-events-none"
                              style={{ clipPath: `inset(0 ${100 - (cardCompare[img.mediaId]?.sliderPos ?? 50)}% 0 0)` }}
                            >
                              <img
                                src={`data:${(references[cardCompare[img.mediaId]?.refIndex || 0] || references[0]).mimeType};base64,${(references[cardCompare[img.mediaId]?.refIndex || 0] || references[0]).base64}`}
                                alt="Original Reference"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <span className="absolute bottom-4 left-4 bg-[#2b2a27]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase z-20 shadow-xs pointer-events-none">
                                Original (Sujeto)
                              </span>
                            </div>

                            {/* Divider line */}
                            <div
                              className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-25 shadow-[0_0_8px_rgba(0,0,0,0.8)]"
                              style={{ left: `${cardCompare[img.mediaId]?.sliderPos ?? 50}%` }}
                            >
                              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-[#2b2a27] shadow-xl flex items-center justify-center font-bold text-[10px]">
                                ↔
                              </div>
                            </div>

                            {/* Drag input */}
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={cardCompare[img.mediaId]?.sliderPos ?? 50}
                              onChange={(e) => handleSliderChange(img.mediaId, Number(e.target.value))}
                              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
                            />
                          </div>
                        ) : (
                          /* SIDE BY SIDE VIEW OVERLAY */
                          <div className="relative w-full h-full grid grid-cols-2 gap-0.5 bg-black p-0.5 pt-22">
                            {/* Left: Original Reference */}
                            <div className="relative w-full h-full overflow-hidden rounded-xs bg-stone-900">
                              <img
                                src={`data:${(references[cardCompare[img.mediaId]?.refIndex || 0] || references[0]).mimeType};base64,${(references[cardCompare[img.mediaId]?.refIndex || 0] || references[0]).base64}`}
                                alt="Original Reference"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-2 left-2 bg-[#2b2a27]/90 text-white text-[8px] font-mono px-1.5 py-0.5 rounded-2xs uppercase">
                                Original
                              </span>
                            </div>

                            {/* Right: AI Result */}
                            <div className="relative w-full h-full overflow-hidden rounded-xs bg-stone-900">
                              <img
                                src={`data:${img.mimeType};base64,${img.base64}`}
                                alt="AI Result"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-2 right-2 bg-[#c25e38]/90 text-white text-[8px] font-mono px-1.5 py-0.5 rounded-2xs uppercase">
                                Resultado IA
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-stone-300">
                        <span className="material-symbols-outlined text-3xl mb-2 text-stone-500">broken_image</span>
                        <p className="text-xs font-serif italic text-white">Sin fotos de referencia</p>
                        <p className="text-[10px] text-stone-400 mt-1">
                          No se cargaron imágenes de referencia del sujeto en la sesión para comparar.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Dock on Hover */}
                <div className="absolute bottom-3.5 inset-x-3.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  {/* Left: Re-shoot single shot */}
                  <button
                    type="button"
                    onClick={() => handleRegenerate(img)}
                    disabled={isRegenerating}
                    title="Re-disparar solo esta toma"
                    className="h-8.5 px-3 bg-[#1c1917]/90 hover:bg-[#1c1917] backdrop-blur-md rounded-full flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg transition-all border border-white/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">replay</span>
                    <span>Re-disparar</span>
                  </button>

                  {/* Right: Clean, grouped editorial dock */}
                  <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-full shadow-lg border border-[#e5e3da]">
                    {onInpaintArea && (
                      <button
                        type="button"
                        onClick={() => onInpaintArea(img)}
                        title="Pincel Mágico (Borrar / Modificar objeto)"
                        className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[#c25e38] hover:bg-stone-100 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">brush</span>
                      </button>
                    )}

                    {onEditWithAI && (
                      <button
                        type="button"
                        onClick={() => onEditWithAI(img)}
                        title="Editar con IA"
                        className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[#1c1917] hover:bg-stone-100 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">image_edit_auto</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDetailsImage(img)}
                      title="Metadatos EXIF"
                      className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[#78716c] hover:text-[#1c1917] hover:bg-stone-100 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">tune</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCoverImage(img)}
                      title="Crear portada de revista editorial"
                      className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[#78716c] hover:text-[#1c1917] hover:bg-stone-100 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_stories</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      title="Pantalla completa"
                      className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[#78716c] hover:text-[#1c1917] hover:bg-stone-100 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                    </button>

                    <div className="w-[1px] h-4 bg-stone-300 mx-0.5" />

                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(img, i)}
                      title="Descargar foto"
                      className="w-7.5 h-7.5 bg-[#c25e38] text-white rounded-full flex items-center justify-center shadow-xs hover:bg-[#a64d2b] transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">download</span>
                    </button>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>

              {/* Caption with Clickable EXIF Metadata Trigger */}
              <div className="flex justify-between items-center px-1 pt-1">
                <div className="min-w-0 pr-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#78716c]">
                    {img.name.split(' - ')[1] || 'Editorial Shot'}
                  </p>
                  <p className="text-xs italic font-serif text-[#1c1917] truncate mt-0.5">
                    {img.exif?.cameraModel || 'Hasselblad 100MP'} • {img.exif?.lens || '85mm'} • {img.exif?.aperture || 'f/1.8'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsImage(img)}
                  title="Edit Metadata"
                  className="shrink-0 px-3 py-1.5 bg-white border border-[#e5e3da] hover:border-[#c25e38] text-[#2b2a27] hover:text-[#c25e38] rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px] text-[#c25e38]">tune</span>
                  <span>Edit Metadata</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quote */}
      <div className="mt-20 pt-12 border-t border-[#e5e3da] text-center space-y-3">
        <p className="font-serif italic text-2xl text-[#57534e] max-w-lg mx-auto">
          "The details are not the details. They make the design."
        </p>
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#78716c]">
          Studio Session AI Pro • Haute Couture Edition
        </p>
      </div>

      {/* Modals */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDownload={(img) => {
            const idx = images.findIndex((i) => i.mediaId === img.mediaId);
            handleDownloadSingle(img, idx >= 0 ? idx : 0);
          }}
          onEditDetails={(img) => {
            setSelectedImage(null);
            setDetailsImage(img);
          }}
        />
      )}

      {/* Photo Details (EXIF) Overlay */}
      {detailsImage && (
        <PhotoDetailsModal
          image={detailsImage}
          onClose={() => setDetailsImage(null)}
          onSaveMetadata={(mediaId, updatedExif) => {
            onUpdateImageMetadata(mediaId, updatedExif);
            // Also update local detailsImage if kept open
            setDetailsImage((prev) => (prev ? { ...prev, exif: updatedExif } : null));
          }}
        />
      )}

      {compareImage && (
        <CompareModal
          generatedImage={compareImage}
          references={references}
          onClose={() => setCompareImage(null)}
        />
      )}

      {coverImage && (
        <MagazineCoverModal
          image={coverImage}
          onClose={() => setCoverImage(null)}
        />
      )}
    </div>
  );
}
