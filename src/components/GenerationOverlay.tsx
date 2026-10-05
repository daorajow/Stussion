import { motion } from 'motion/react';

interface Props {
  progress: number;
  currentStepText?: string;
}

export function GenerationOverlay({ progress, currentStepText }: Props) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius; // ~376.99
  const strokeDashoffset = circumference - (circumference * Math.min(progress, 100)) / 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#f5f4ef]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 border-2 border-[#e5e3da] rounded-full mx-auto flex items-center justify-center overflow-hidden bg-white/70 shadow-inner">
            <motion.div
              animate={{
                y: [0, -6, 0],
                rotate: [0, 4, -4, 0],
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="text-[#c25e38]"
            >
              <span className="material-symbols-outlined text-4xl">photo_camera</span>
            </motion.div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="w-36 h-36 -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                fill="none"
                stroke="#e5e3da"
                strokeWidth="2"
              />
              <motion.circle
                cx="72"
                cy="72"
                r={radius}
                fill="none"
                stroke="#c25e38"
                strokeWidth="3.5"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-serif italic text-3xl text-[#1c1917]">
            Revelando Sesión...
          </h3>
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#78716c]">
            {currentStepText || 'Capturando detalles, identidad y esencia editorial'}
          </p>
        </div>

        <div className="w-full h-[2px] bg-[#e5e3da] relative overflow-hidden rounded-full">
          <motion.div
            className="absolute inset-y-0 left-0 bg-[#c25e38]"
            animate={{ width: `${Math.max(5, progress)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-[#78716c] px-1">
          <span>NANO BANANA PRO</span>
          <span className="font-bold text-[#c25e38]">{progress}% COMPLETADO</span>
          <span>ESTUDIO EDITORIAL</span>
        </div>

        <div className="pt-2 grid grid-cols-3 gap-2 opacity-50">
          <div className="h-1 bg-[#c25e38] rounded-full animate-pulse"></div>
          <div className="h-1 bg-[#c25e38] rounded-full animate-pulse [animation-delay:150ms]"></div>
          <div className="h-1 bg-[#c25e38] rounded-full animate-pulse [animation-delay:300ms]"></div>
        </div>

        <p className="text-[10px] text-[#a8a29e] italic">
          Procesando iluminación de alta gama, texturas de piel y consistencia facial
        </p>
      </div>
    </motion.div>
  );
}
