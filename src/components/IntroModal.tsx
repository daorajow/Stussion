import { motion } from 'motion/react';

interface Props {
  onClose: () => void;
}

export function IntroModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-[#2b2a27]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#f5f4ef] w-full max-w-xl rounded-sm shadow-2xl overflow-hidden border border-[#e5e3da]"
      >
        <div className="relative aspect-[16/9] bg-[#2b2a27] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop"
            alt="Photography Studio"
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f5f4ef] via-[#f5f4ef]/20 to-transparent"></div>
          <div className="absolute bottom-6 left-8 right-8">
            <h2 className="font-serif italic text-4xl text-[#1c1917] leading-tight">
              Studio Session AI Pro
            </h2>
            <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#78716c] mt-1">
              Control editorial total • Nano Banana Pro
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-sm bg-[#c25e38]/10 text-[#c25e38] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">group</span>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2b2a27]">
                  Múltiples Referencias
                </h4>
                <p className="text-sm text-[#78716c] leading-relaxed mt-0.5">
                  Carga varios ángulos del rostro para que la IA entienda perfectamente la
                  estructura facial del sujeto y mantenga la consistencia en todas las tomas.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-sm bg-[#c25e38]/10 text-[#c25e38] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">campaign</span>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2b2a27]">
                  Dirección de Arte
                </h4>
                <p className="text-sm text-[#78716c] leading-relaxed mt-0.5">
                  Describe la ropa, iluminación, fondo o el estilismo de la sesión para guiar los
                  resultados creativos como un director de arte en Milán o París.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-sm bg-[#c25e38]/10 text-[#c25e38] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">verified</span>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2b2a27]">
                  Alta Fidelidad
                </h4>
                <p className="text-sm text-[#78716c] leading-relaxed mt-0.5">
                  Resultados optimizados con estética Hasselblad en formato editorial 4:5, listos
                  para lookbooks de moda, portafolios y campañas.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full bg-[#c25e38] text-white py-4 font-bold uppercase tracking-[0.2em] text-xs hover:bg-[#a64d2b] transition-all shadow-lg shadow-[#c25e38]/20 cursor-pointer"
            >
              Configurar Sesión Pro
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
