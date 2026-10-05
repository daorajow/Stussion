import { MediaItem } from '../types';

interface Props {
  image: MediaItem | null;
  onClose: () => void;
  onDownload: (img: MediaItem) => void;
  onEditDetails?: (img: MediaItem) => void;
}

export function ImageDetailModal({ image, onClose, onDownload, onEditDetails }: Props) {
  if (!image) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#2b2a27]/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#f5f4ef] rounded-sm max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#e5e3da] flex flex-col md:flex-row"
      >
        {/* Image Preview Container */}
        <div className="md:w-3/5 bg-[#1c1917] flex items-center justify-center p-4 relative min-h-[360px] md:min-h-[500px]">
          <img
            src={`data:${image.mimeType};base64,${image.base64}`}
            alt={image.name}
            className="max-h-[75vh] w-auto max-w-full object-contain shadow-2xl"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 left-4">
            <span className="bg-[#2b2a27]/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-xs uppercase tracking-wider">
              {image.name}
            </span>
          </div>
        </div>

        {/* Details & Metadata Sidebar */}
        <div className="md:w-2/5 p-6 md:p-8 flex flex-col justify-between space-y-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#c25e38]">
                  Placa Editorial
                </span>
                <h3 className="font-serif italic text-2xl text-[#1c1917] mt-1">
                  {image.name}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-[#e5e3da] hover:bg-white flex items-center justify-center text-[#78716c] hover:text-[#1c1917] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 pt-2 text-xs border-t border-[#e5e3da]">
              <div className="flex justify-between py-1.5 border-b border-[#e5e3da]/60">
                <span className="text-[#78716c]">Motor de Render</span>
                <span className="font-mono font-medium text-[#1c1917]">Nano Banana Pro</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#e5e3da]/60">
                <span className="text-[#78716c]">Proporción</span>
                <span className="font-mono font-medium text-[#1c1917]">{image.aspectRatio || '4:5'} Editorial</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#e5e3da]/60">
                <span className="text-[#78716c]">Lente Virtual</span>
                <span className="font-mono font-medium text-[#1c1917]">85mm f/1.4 Medium Format</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#e5e3da]/60">
                <span className="text-[#78716c]">Fidelidad Facial</span>
                <span className="font-mono font-medium text-emerald-700">Multi-Angle Identity</span>
              </div>
            </div>

            {/* Real World Camera Replicator (EXIF) */}
            <div className="bg-[#f5f4ef] p-3.5 rounded-sm border border-[#e5e3da] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#c25e38] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">camera</span>
                  Parámetros EXIF de la Toma:
                </span>
                {onEditDetails && (
                  <button
                    type="button"
                    onClick={() => onEditDetails(image)}
                    className="text-[10px] text-[#c25e38] hover:underline font-bold uppercase tracking-wider flex items-center gap-0.5"
                  >
                    <span>Editar EXIF</span>
                    <span className="material-symbols-outlined text-[12px]">edit</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div>• Cámara: {image.exif?.cameraModel || 'Hasselblad H6D-100c'}</div>
                <div>• Lente: {image.exif?.lens || '85mm f/1.4'}</div>
                <div>• Apertura: {image.exif?.aperture || 'f/1.8'}</div>
                <div>• Velocidad: {image.exif?.shutterSpeed || '1/500s'}</div>
              </div>
              <p className="text-[9px] text-[#78716c] italic">
                {image.exif?.lightingSetup || 'Esquema de luz: Softbox octabox 120cm a 45° + reflector blanco suave.'}
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-sm border border-[#e5e3da] space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716c]">
                Especificaciones de Color
              </span>
              <p className="text-[11px] text-[#57534e] leading-relaxed italic">
                Gradación cinematográfica de estudio de moda, sombras ricas en textura y
                conservación de poros y tono cutáneo natural.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#e5e3da] flex gap-3">
            <button
              onClick={() => onDownload(image)}
              className="flex-1 bg-[#c25e38] text-white hover:bg-[#a64d2b] py-3 px-4 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#c25e38]/20"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Descargar Imagen (HD)
            </button>
            <button
              onClick={onClose}
              className="border border-[#e5e3da] hover:bg-white text-[#78716c] hover:text-[#1c1917] px-4 py-3 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
