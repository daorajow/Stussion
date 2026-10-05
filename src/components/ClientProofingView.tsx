import { useState } from 'react';
import JSZip from 'jszip';
import { MediaItem } from '../types';

interface Props {
  images: MediaItem[];
  onToggleFavorite: (mediaId: string) => void;
  onExitClientMode: () => void;
  clientName?: string;
}

export function ClientProofingView({
  images,
  onToggleFavorite,
  onExitClientMode,
  clientName = 'Nuestra Sesión de Boda & Amor',
}: Props) {
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [activePreview, setActivePreview] = useState<MediaItem | null>(null);

  const favoriteCount = images.filter((img) => img.isFavorite).length;
  const displayedImages = filterFavorites ? images.filter((img) => img.isFavorite) : images;

  const downloadFavoritesZip = async () => {
    const toDownload = images.filter((img) => img.isFavorite);
    if (toDownload.length === 0) return;

    const zip = new JSZip();
    toDownload.forEach((img, idx) => {
      const cleanBase64 = img.base64.replace(/^data:[^;]+;base64,/, '');
      zip.file(`Favorita_${idx + 1}.jpg`, cleanBase64, { base64: true });
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Seleccion_Favoritas_Sesion.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Client Header Bar */}
      <div className="bg-white p-6 md:p-8 rounded-sm border border-[#e5e3da] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6 text-center md:text-left">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#c25e38] font-bold">
            Portal Privado de Entrega & Selección
          </span>
          <h2 className="font-serif italic text-3xl md:text-4xl text-[#1c1917] mt-1">
            {clientName}
          </h2>
          <p className="text-xs text-[#78716c] mt-1">
            Toca el corazón en tus fotos favoritas para crear tu selección para el álbum.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
          <div className="flex items-center gap-1 bg-[#f5f4ef] p-1 rounded-full border border-[#e5e3da] text-xs">
            <button
              onClick={() => setFilterFavorites(false)}
              className={`px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all ${
                !filterFavorites
                  ? 'bg-[#2b2a27] text-white shadow-xs'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              Todas ({images.length})
            </button>
            <button
              onClick={() => setFilterFavorites(true)}
              className={`px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                filterFavorites
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              <span>❤️ Favoritas</span>
              <span>({favoriteCount})</span>
            </button>
          </div>

          {favoriteCount > 0 && (
            <button
              onClick={downloadFavoritesZip}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-red-700 shadow-md transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Descargar {favoriteCount} Favoritas
            </button>
          )}

          <button
            onClick={onExitClientMode}
            className="px-4 py-2 border border-[#e5e3da] hover:bg-white text-xs font-bold uppercase tracking-wider rounded-full text-[#78716c] hover:text-[#1c1917] transition-all"
          >
            ← Volver a Modo Fotógrafo
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedImages.map((img, i) => (
          <div
            key={img.mediaId || i}
            className="group relative aspect-[4/5] bg-white rounded-sm border border-[#e5e3da] overflow-hidden shadow-2xs hover:shadow-xl transition-all cursor-pointer"
            onClick={() => setActivePreview(img)}
          >
            <img
              src={`data:${img.mimeType};base64,${img.base64}`}
              alt={`Foto ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />

            {/* Favorite Heart Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(img.mediaId);
              }}
              title={img.isFavorite ? 'Quitar de favoritas' : 'Marcar como favorita'}
              className={`absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg z-10 ${
                img.isFavorite
                  ? 'bg-red-600 text-white scale-110'
                  : 'bg-white/90 text-[#2b2a27] hover:scale-110 hover:text-red-600'
              }`}
            >
              <span className="material-symbols-outlined text-2xl font-bold">
                {img.isFavorite ? 'favorite' : 'favorite_border'}
              </span>
            </button>

            {/* Plate info */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white pointer-events-none drop-shadow-md">
              <span className="text-xs font-serif italic">
                {img.name.split(' - ')[1] || `Toma 0${i + 1}`}
              </span>
              <span className="text-[10px] font-mono uppercase bg-black/60 px-2 py-0.5 rounded-2xs">
                {img.isFavorite ? '★ APROBADA' : 'HAZ CLIC PARA AMPLIAR'}
              </span>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Lightbox Preview */}
      {activePreview && (
        <div
          onClick={() => setActivePreview(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
          >
            <img
              src={`data:${activePreview.mimeType};base64,${activePreview.base64}`}
              alt="Preview"
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-xs shadow-2xl"
            />

            <div className="flex items-center gap-4 mt-4 text-white">
              <button
                onClick={() => onToggleFavorite(activePreview.mediaId)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all ${
                  activePreview.isFavorite ? 'bg-red-600 text-white' : 'bg-white text-black'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {activePreview.isFavorite ? 'favorite' : 'favorite_border'}
                </span>
                {activePreview.isFavorite ? 'Toma Seleccionada ❤️' : 'Marcar como Favorita'}
              </button>

              <button
                onClick={() => setActivePreview(null)}
                className="px-5 py-2 border border-white/40 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-white hover:text-black transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
