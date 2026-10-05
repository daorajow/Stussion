import { useRef, useState, useEffect } from 'react';
import { MediaItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddCapturedPhotos: (photos: MediaItem[]) => void;
}

const STEPS = [
  { label: 'Toma 1: Frontal', hint: 'Mira directamente a la cámara con expresión neutra' },
  { label: 'Toma 2: Ángulo 3/4', hint: 'Gira suavemente el rostro 30° a tu izquierda' },
  { label: 'Toma 3: Ángulo o Sonrisa', hint: 'Gira al otro lado o muestra una sonrisa sutil' },
];

export function WebcamCaptureModal({ isOpen, onClose, onAddCapturedPhotos }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [capturedList, setCapturedList] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'No se pudo acceder a la cámara. Asegúrate de otorgar permisos en tu navegador.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas (mirrored)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Url = canvas.toDataURL('image/jpeg', 0.9);
    const cleanBase64 = base64Url.split(',')[1];

    // Trigger visual flash
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const updated = [...capturedList, cleanBase64];
    setCapturedList(updated);

    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handleConfirm = () => {
    if (capturedList.length === 0) return;
    const items: MediaItem[] = capturedList.map((base64, idx) => ({
      mediaId: `cam-${Date.now()}-${idx}`,
      base64,
      mimeType: 'image/jpeg',
      type: 'image',
      name: `Selfie Captura 0${idx + 1}`,
    }));
    onAddCapturedPhotos(items);
    onClose();
  };

  const handleRemovePhoto = (idx: number) => {
    setCapturedList((prev) => prev.filter((_, i) => i !== idx));
    if (stepIndex > 0) setStepIndex((prev) => prev - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#2b2a27]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative bg-[#f5f4ef] rounded-sm max-w-xl w-full border border-[#e5e3da] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e3da] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#c25e38]">videocam</span>
            <h3 className="font-serif italic text-xl text-[#1c1917]">
              Captura de Referencias por Cámara
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#e5e3da] flex items-center justify-center text-[#78716c] hover:text-[#1c1917]"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Video Viewport */}
        <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />

          {/* Flash animation */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white opacity-80 pointer-events-none transition-opacity" />
          )}

          {/* Biometric Oval Guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-64 border-2 border-dashed border-white/60 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex flex-col items-center justify-between py-6">
              <span className="text-[10px] uppercase font-mono tracking-widest text-white/80 bg-black/50 px-2 py-0.5 rounded-full">
                {STEPS[stepIndex]?.label || 'Alineación'}
              </span>
              <span className="text-[10px] text-white/90 text-center px-4 font-sans bg-black/60 py-1 rounded-sm">
                {STEPS[stepIndex]?.hint || 'Alinea tu rostro dentro del óvalo'}
              </span>
            </div>
          </div>

          {/* Camera Error */}
          {cameraError && (
            <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center p-6 text-center text-white">
              <span className="material-symbols-outlined text-4xl text-amber-500 mb-2">
                videocam_off
              </span>
              <p className="text-sm max-w-sm mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-[#c25e38] text-white text-xs font-bold uppercase tracking-wider rounded-full"
              >
                Reintentar Acceso
              </button>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls & Thumbnail Strip */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {STEPS.map((s, idx) => (
                <div
                  key={idx}
                  className={`w-7 h-7 rounded-full text-xs font-mono flex items-center justify-center border transition-all ${
                    idx < capturedList.length
                      ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                      : idx === stepIndex
                      ? 'bg-[#c25e38] border-[#c25e38] text-white'
                      : 'border-[#e5e3da] text-[#78716c] bg-white'
                  }`}
                >
                  {idx < capturedList.length ? '✓' : idx + 1}
                </div>
              ))}
              <span className="text-xs text-[#78716c] ml-2">
                {capturedList.length} de {STEPS.length} tomas capturadas
              </span>
            </div>

            <button
              onClick={handleCapture}
              disabled={Boolean(cameraError)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#c25e38] hover:bg-[#a64d2b] text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">camera</span>
              Disparar Foto
            </button>
          </div>

          {/* Captured Thumbnails */}
          {capturedList.length > 0 && (
            <div className="flex items-center gap-3 pt-2 border-t border-[#e5e3da]">
              <div className="flex gap-2 flex-1 overflow-x-auto py-1">
                {capturedList.map((base64, i) => (
                  <div
                    key={i}
                    className="relative w-14 h-14 rounded-sm overflow-hidden border border-[#e5e3da] shrink-0 group"
                  >
                    <img
                      src={`data:image/jpeg;base64,${base64}`}
                      alt={`Toma ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemovePhoto(i)}
                      className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 bg-[#2b2a27] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#1c1917] shrink-0"
              >
                Usar {capturedList.length} Referencias
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
