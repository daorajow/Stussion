import { useState, useEffect } from 'react';
import { MediaItem, PhotoExifData } from '../types';

interface Props {
  image: MediaItem | null;
  onClose: () => void;
  onSaveMetadata: (mediaId: string, updatedExif: PhotoExifData) => void;
}

const POPULAR_CAMERAS = [
  'Hasselblad H6D-100c',
  'Sony A7 IV',
  'Canon EOS R5',
  'Leica M11',
  'Fujifilm GFX 100 II',
  'Nikon Z8',
];

const POPULAR_LENSES = [
  '85mm f/1.4',
  '50mm f/1.2',
  '35mm f/1.4',
  '70-200mm f/2.8',
  '105mm f/2.8 Macro',
  '24-70mm f/2.8',
];

const POPULAR_APERTURES = ['f/1.2', 'f/1.4', 'f/1.8', 'f/2.8', 'f/4.0', 'f/5.6'];
const POPULAR_SHUTTERS = ['1/250s', '1/500s', '1/800s', '1/1000s', '1/2000s'];
const POPULAR_ISOS = ['ISO 50', 'ISO 100', 'ISO 200', 'ISO 400', 'ISO 800'];

export function PhotoDetailsModal({ image, onClose, onSaveMetadata }: Props) {
  if (!image) return null;

  // Initialize with existing exif or sensible defaults
  const getDefaultExif = (): PhotoExifData => image.exif || {
    cameraModel: 'Hasselblad H6D-100c',
    lens: '85mm f/1.4 Portrait Lens',
    aperture: 'f/1.8',
    shutterSpeed: '1/500s',
    iso: 'ISO 100',
    lightingSetup: 'Softbox Octabox 120cm a 45° + Reflector suave',
    colorSpace: 'sRGB / Display P3',
    photographer: 'Studio Session Pro',
  };

  const [formData, setFormData] = useState<PhotoExifData>(getDefaultExif());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (image) {
      setFormData(
        image.exif || {
          cameraModel: 'Hasselblad H6D-100c',
          lens: '85mm f/1.4 Portrait Lens',
          aperture: 'f/1.8',
          shutterSpeed: '1/500s',
          iso: 'ISO 100',
          lightingSetup: 'Softbox Octabox 120cm a 45° + Reflector suave',
          colorSpace: 'sRGB / Display P3',
          photographer: 'Studio Session Pro',
        }
      );
    }
  }, [image]);

  const handleSave = () => {
    onSaveMetadata(image.mediaId, formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleResetToDefault = () => {
    setFormData({
      cameraModel: 'Hasselblad H6D-100c',
      lens: '85mm f/1.4 Portrait Lens',
      aperture: 'f/1.8',
      shutterSpeed: '1/500s',
      iso: 'ISO 100',
      lightingSetup: 'Softbox Octabox 120cm a 45° + Reflector suave',
      colorSpace: 'sRGB / Display P3',
      photographer: 'Studio Session Pro',
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#2b2a27]/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#f5f4ef] rounded-sm max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-[#e5e3da] flex flex-col md:flex-row"
      >
        {/* Left Side: Photo Preview with Live EXIF Tag Badge */}
        <div className="md:w-5/12 bg-[#1c1917] p-6 flex flex-col items-center justify-center relative min-h-[300px]">
          <div className="relative aspect-[4/5] w-full max-h-[60vh] rounded-xs overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center bg-black">
            <img
              src={`data:${image.mimeType};base64,${image.base64}`}
              alt={image.name}
              className="w-full h-full object-cover"
            />

            {/* Technical HUD Overlay on Image */}
            <div className="absolute bottom-3 inset-x-3 bg-black/80 backdrop-blur-md p-2.5 rounded-2xs text-white border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#c25e38] font-bold">
                <span>EXIF METADATA HUD</span>
                <span className="text-white/60">{image.aspectRatio || '4:5'}</span>
              </div>
              <p className="text-xs font-mono font-bold text-white truncate">
                {formData.cameraModel} • {formData.lens}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/80">
                <span className="bg-white/10 px-1 rounded-2xs">{formData.aperture}</span>
                <span className="bg-white/10 px-1 rounded-2xs">{formData.shutterSpeed}</span>
                <span className="bg-white/10 px-1 rounded-2xs">{formData.iso}</span>
              </div>
            </div>

            <div className="absolute top-3 left-3 bg-[#2b2a27]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase">
              {image.name.split(' - ')[1] || 'Editorial Shot'}
            </div>
          </div>
        </div>

        {/* Right Side: EXIF Metadata Editor Controls */}
        <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-white space-y-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#e5e3da] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#c25e38] bg-[#c25e38]/10 px-2 py-0.5 rounded-2xs">
                    Editor de Metadatos
                  </span>
                  <span className="text-xs font-mono text-[#78716c]">• Exif Studio</span>
                </div>
                <h3 className="font-serif italic text-2xl text-[#1c1917] mt-1">
                  Detalles y Metadatos de la Fotografía
                </h3>
                <p className="text-xs text-[#78716c] mt-0.5">
                  Personaliza los datos EXIF (cámara, lente, apertura, velocidad) y guárdalos permanentemente en esta foto.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-[#e5e3da] flex items-center justify-center text-[#78716c] hover:text-[#1c1917]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Camera Model Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#c25e38]">photo_camera</span>
                <span>Camera Model / Modelo de Cámara</span>
              </label>
              <input
                type="text"
                value={formData.cameraModel}
                onChange={(e) => setFormData({ ...formData, cameraModel: e.target.value })}
                placeholder="Ej: Hasselblad H6D-100c"
                className="w-full text-xs p-2.5 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38]"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {POPULAR_CAMERAS.map((cam) => (
                  <button
                    key={cam}
                    type="button"
                    onClick={() => setFormData({ ...formData, cameraModel: cam })}
                    className={`text-[9px] px-2 py-0.5 rounded-2xs border font-mono transition-all ${
                      formData.cameraModel === cam
                        ? 'bg-[#2b2a27] text-white border-[#2b2a27]'
                        : 'border-[#e5e3da] text-[#78716c] hover:border-[#78716c]'
                    }`}
                  >
                    {cam}
                  </button>
                ))}
              </div>
            </div>

            {/* Lens Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#c25e38]">camera</span>
                <span>Lens / Objetivo</span>
              </label>
              <input
                type="text"
                value={formData.lens}
                onChange={(e) => setFormData({ ...formData, lens: e.target.value })}
                placeholder="Ej: 85mm f/1.4"
                className="w-full text-xs p-2.5 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38]"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {POPULAR_LENSES.map((lens) => (
                  <button
                    key={lens}
                    type="button"
                    onClick={() => setFormData({ ...formData, lens })}
                    className={`text-[9px] px-2 py-0.5 rounded-2xs border font-mono transition-all ${
                      formData.lens === lens
                        ? 'bg-[#2b2a27] text-white border-[#2b2a27]'
                        : 'border-[#e5e3da] text-[#78716c] hover:border-[#78716c]'
                    }`}
                  >
                    {lens}
                  </button>
                ))}
              </div>
            </div>

            {/* Triplet: Aperture, Shutter Speed, ISO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Aperture */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1c1917]">
                  Aperture (f/)
                </label>
                <input
                  type="text"
                  value={formData.aperture}
                  onChange={(e) => setFormData({ ...formData, aperture: e.target.value })}
                  placeholder="f/1.8"
                  className="w-full text-xs p-2 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38] font-mono"
                />
                <div className="flex flex-wrap gap-1">
                  {POPULAR_APERTURES.slice(0, 4).map((ap) => (
                    <button
                      key={ap}
                      type="button"
                      onClick={() => setFormData({ ...formData, aperture: ap })}
                      className="text-[9px] px-1.5 py-0.5 border border-[#e5e3da] text-[#78716c] font-mono rounded-2xs hover:border-[#78716c]"
                    >
                      {ap}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shutter Speed */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1c1917]">
                  Shutter Speed (s)
                </label>
                <input
                  type="text"
                  value={formData.shutterSpeed}
                  onChange={(e) => setFormData({ ...formData, shutterSpeed: e.target.value })}
                  placeholder="1/500s"
                  className="w-full text-xs p-2 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38] font-mono"
                />
                <div className="flex flex-wrap gap-1">
                  {POPULAR_SHUTTERS.slice(0, 4).map((sh) => (
                    <button
                      key={sh}
                      type="button"
                      onClick={() => setFormData({ ...formData, shutterSpeed: sh })}
                      className="text-[9px] px-1.5 py-0.5 border border-[#e5e3da] text-[#78716c] font-mono rounded-2xs hover:border-[#78716c]"
                    >
                      {sh}
                    </button>
                  ))}
                </div>
              </div>

              {/* ISO */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1c1917]">
                  ISO Sensitivity
                </label>
                <input
                  type="text"
                  value={formData.iso || 'ISO 100'}
                  onChange={(e) => setFormData({ ...formData, iso: e.target.value })}
                  placeholder="ISO 100"
                  className="w-full text-xs p-2 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38] font-mono"
                />
                <div className="flex flex-wrap gap-1">
                  {POPULAR_ISOS.slice(1, 5).map((iso) => (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setFormData({ ...formData, iso })}
                      className="text-[9px] px-1.5 py-0.5 border border-[#e5e3da] text-[#78716c] font-mono rounded-2xs hover:border-[#78716c]"
                    >
                      {iso}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lighting Setup & Photographer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1c1917]">
                  Esquema de Iluminación
                </label>
                <input
                  type="text"
                  value={formData.lightingSetup || ''}
                  onChange={(e) => setFormData({ ...formData, lightingSetup: e.target.value })}
                  placeholder="Ej: Rembrandt 45° + Reflector plateado"
                  className="w-full text-xs p-2 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#1c1917]">
                  Créditos de Fotógrafo / Estudio
                </label>
                <input
                  type="text"
                  value={formData.photographer || ''}
                  onChange={(e) => setFormData({ ...formData, photographer: e.target.value })}
                  placeholder="Ej: Studio Session Pro"
                  className="w-full text-xs p-2 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38]"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#e5e3da] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-[#78716c] hover:text-[#1c1917] underline cursor-pointer"
            >
              Restablecer valores
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-[#e5e3da] rounded-sm text-xs font-bold uppercase tracking-wider text-[#78716c] hover:bg-stone-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 bg-[#c25e38] hover:bg-[#a64d2b] text-white text-xs font-bold uppercase tracking-widest rounded-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {savedSuccess ? 'check' : 'save'}
                </span>
                <span>{savedSuccess ? 'Changes Saved!' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
