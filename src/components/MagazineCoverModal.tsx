import { useState, useRef } from 'react';
import { MediaItem } from '../types';

interface Props {
  image: MediaItem | null;
  onClose: () => void;
}

const MASTHEADS = ['STUDIO', 'VOGUE', 'HARPER’S', 'NUMÉRO', 'L’OFFICIEL'];

const HEADLINES = [
  { main: 'THE POWER ISSUE', sub: 'Elegancia, identidad y el futuro del retrato editorial' },
  { main: 'MODERN MINIMALISM', sub: 'Menos es todo: cortes impecables y presencia absoluta' },
  { main: 'HAUTE COUTURE FW25', sub: 'De París a Milán: las siluetas que definen la temporada' },
  { main: 'THE NEW FACES', sub: 'Fidelidad facial y la nueva era de la fotografía digital' },
];

export function MagazineCoverModal({ image, onClose }: Props) {
  const [masthead, setMasthead] = useState('STUDIO');
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [customHeadline, setCustomHeadline] = useState('');
  const [coverFilter, setCoverFilter] = useState<'normal' | 'bw' | 'warm' | 'cool'>('normal');
  const [isExporting, setIsExporting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  if (!image) return null;

  const currentHeadline = customHeadline.trim()
    ? { main: customHeadline.trim(), sub: 'Edición Especial de Portada • Studio Session AI' }
    : HEADLINES[headlineIndex];

  // Export cover composite to PNG via canvas
  const handleExportCover = async () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350; // 4:5 ratio
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `data:${image.mimeType};base64,${image.base64}`;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Apply filter
      if (coverFilter === 'bw') {
        ctx.filter = 'grayscale(100%) contrast(110%)';
      } else if (coverFilter === 'warm') {
        ctx.filter = 'sepia(25%) saturate(120%) brightness(102%)';
      } else if (coverFilter === 'cool') {
        ctx.filter = 'hue-rotate(180deg) saturate(90%)';
      } else {
        ctx.filter = 'none';
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none'; // reset filter for text

      // Top subtle gradient for masthead legibility
      const topGrad = ctx.createLinearGradient(0, 0, 0, 320);
      topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, canvas.width, 320);

      // Bottom gradient for headlines
      const btmGrad = ctx.createLinearGradient(0, canvas.height - 400, 0, canvas.height);
      btmGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      btmGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = btmGrad;
      ctx.fillRect(0, canvas.height - 400, canvas.width, 400);

      // Masthead
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '900 130px "Playfair Display", Georgia, serif';
      ctx.letterSpacing = '6px';
      ctx.fillText(masthead, canvas.width / 2, 170);

      // Sub-masthead line
      ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
      ctx.letterSpacing = '5px';
      ctx.fillText('EDITION NO. 04 • FALL / WINTER LOOKBOOK', canvas.width / 2, 215);

      // Main Headline
      ctx.textAlign = 'left';
      ctx.font = '900 italic 54px "Playfair Display", Georgia, serif';
      ctx.fillText(currentHeadline.main, 70, canvas.height - 150);

      // Sub headline
      ctx.font = '400 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(currentHeadline.sub, 70, canvas.height - 100);

      // Barcode simulation
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(canvas.width - 180, canvas.height - 90, 110, 45);
      ctx.fillStyle = '#000000';
      ctx.font = '10px monospace';
      ctx.fillText('|| | |||| || |', canvas.width - 170, canvas.height - 62);

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Portada_Revista_${masthead}_Editorial.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating magazine cover:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#2b2a27]/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#f5f4ef] rounded-sm max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-[#e5e3da] flex flex-col md:flex-row"
      >
        {/* Cover Preview Canvas (Left) */}
        <div className="md:w-1/2 bg-[#1c1917] p-6 flex items-center justify-center relative min-h-[460px]">
          <div
            ref={previewRef}
            className={`relative aspect-[4/5] h-[75vh] max-h-[580px] bg-black rounded-xs overflow-hidden shadow-2xl border border-white/20 select-none ${
              coverFilter === 'bw'
                ? 'grayscale contrast-110'
                : coverFilter === 'warm'
                ? 'sepia-[25%] saturate-120'
                : coverFilter === 'cool'
                ? 'hue-rotate-180 saturate-90'
                : ''
            }`}
          >
            {/* Background Shot */}
            <img
              src={`data:${image.mimeType};base64,${image.base64}`}
              alt="Cover shot"
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

            {/* Masthead Header */}
            <div className="absolute top-5 inset-x-0 text-center px-4 text-white pointer-events-none">
              <h2 className="font-serif italic font-black text-5xl md:text-6xl tracking-wider drop-shadow-md">
                {masthead}
              </h2>
              <div className="flex items-center justify-center gap-2 text-[9px] uppercase font-mono tracking-[0.3em] opacity-90 mt-1">
                <span>VOL. 24</span>
                <span>•</span>
                <span>EDICIÓN ESPECIAL LOOKBOOK</span>
                <span>•</span>
                <span>PARIS / MILAN</span>
              </div>
            </div>

            {/* Headlines Section */}
            <div className="absolute bottom-6 inset-x-6 text-white pointer-events-none space-y-1.5">
              <span className="text-[10px] uppercase font-mono font-bold tracking-[0.25em] text-[#c25e38] bg-[#2b2a27]/90 px-2 py-0.5 rounded-2xs inline-block">
                EXCLUSIVA EDITORIAL
              </span>
              <h3 className="font-serif italic text-2xl md:text-3xl font-black leading-tight drop-shadow-sm text-balance">
                {currentHeadline.main}
              </h3>
              <p className="text-xs text-white/80 font-sans leading-snug max-w-xs">
                {currentHeadline.sub}
              </p>
            </div>

            {/* Barcode Sticker Simulation */}
            <div className="absolute bottom-4 right-4 bg-white/95 text-black px-2 py-1 rounded-2xs flex flex-col items-center">
              <div className="font-mono text-[9px] tracking-tight leading-none">|| | |||| | ||</div>
              <span className="text-[7px] font-mono mt-0.5">$12.00 US</span>
            </div>
          </div>
        </div>

        {/* Customization Controls (Right) */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6 overflow-y-auto bg-white">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#c25e38]">
                  Maquetador Editorial
                </span>
                <h3 className="font-serif italic text-2xl text-[#1c1917] mt-0.5">
                  Diseña tu Portada de Revista
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-[#e5e3da] flex items-center justify-center text-[#78716c] hover:text-[#1c1917]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Cabecera / Masthead Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1c1917]">
                1. Cabecera de Publicación
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MASTHEADS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMasthead(m)}
                    className={`py-2 px-3 text-xs font-serif font-black rounded-sm border transition-all ${
                      masthead === m
                        ? 'bg-[#2b2a27] text-white border-[#2b2a27]'
                        : 'border-[#e5e3da] hover:border-[#78716c] text-[#57534e]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Headlines Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1c1917]">
                2. Titular Principal
              </label>
              <div className="space-y-1.5">
                {HEADLINES.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setHeadlineIndex(i);
                      setCustomHeadline('');
                    }}
                    className={`w-full text-left p-2.5 rounded-sm border text-xs transition-all ${
                      headlineIndex === i && !customHeadline
                        ? 'border-[#c25e38] bg-[#c25e38]/5 ring-1 ring-[#c25e38]'
                        : 'border-[#e5e3da] hover:border-[#78716c]'
                    }`}
                  >
                    <p className="font-serif italic font-bold text-[#1c1917]">{h.main}</p>
                    <p className="text-[10px] text-[#78716c] truncate">{h.sub}</p>
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                placeholder="O escribe tu propio titular personalizado..."
                className="w-full text-xs p-2.5 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38] transition-colors mt-2"
              />
            </div>

            {/* Filter Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1c1917]">
                3. Filtro de Acabado Impreso
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'normal', label: 'Color Real' },
                  { id: 'bw', label: 'Monocromo' },
                  { id: 'warm', label: 'Portra Cálido' },
                  { id: 'cool', label: 'Editorial Frío' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCoverFilter(f.id as any)}
                    className={`py-2 text-[11px] font-bold rounded-sm border transition-all ${
                      coverFilter === f.id
                        ? 'bg-[#c25e38] text-white border-[#c25e38]'
                        : 'border-[#e5e3da] hover:border-[#78716c] text-[#57534e]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#e5e3da] space-y-2">
            <button
              onClick={handleExportCover}
              disabled={isExporting}
              className="w-full py-3.5 bg-[#c25e38] hover:bg-[#a64d2b] text-white text-xs font-bold uppercase tracking-[0.2em] rounded-sm flex items-center justify-center gap-2 shadow-lg shadow-[#c25e38]/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {isExporting ? 'Maquetando y Descargando...' : 'Descargar Portada en Alta Definición'}
            </button>
            <p className="text-[10px] text-center text-[#78716c]">
              Genera un póster PNG en formato 4:5 listo para Instagram, Pinterest o tu portfolio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
