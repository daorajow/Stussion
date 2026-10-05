import React, { useState, useRef, useEffect } from 'react';
import { MediaItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: MediaItem | null;
  sessionImages?: MediaItem[];
  onAddImageToSession?: (newImage: MediaItem) => void;
  initialTab?: 'create' | 'edit' | 'inpaint';
}

const SAMPLE_CREATE_PROMPTS = [
  'Retrato de alta costura con vestido de satén esmeralda y luz suave de ventana parisina.',
  'Modelo en pasarela de Milán con abrigo de lana estructurado y sombras cinematográficas.',
  'Pareja en terraza de lujo al atardecer con copas de champagne y bokeh crepuscular.',
  'Retrato íntimo en blanco y negro con grano analógico 35mm estilo Peter Lindbergh.',
];

const SAMPLE_EDIT_PROMPTS = [
  'Añadir gafas de sol oscuras de diseñador estilo vintage.',
  'Cambiar el color de la prenda a terciopelo rojo borgoña.',
  'Añadir un halo dorado de atardecer en el cabello (warm rim light).',
  'Cambiar el fondo a un estudio minimalista con ciclorama cálido.',
  'Eliminar distracciones del fondo y añadir desenfoque óptico f/1.4.',
];

const SAMPLE_INPAINT_ACTIONS = [
  { label: '🪄 Borrar objeto (maceta, poste, cable, basura)', instruction: 'Borrar el objeto marcado y reconstruir el fondo de forma natural y limpia con la textura circundante.' },
  { label: '🪴 Reemplazar maceta por jarrón de flores', instruction: 'Reemplazar el objeto marcado por un elegante jarrón de cristal con flores blancas frescas.' },
  { label: '💡 Reemplazar por lámpara de estudio', instruction: 'Reemplazar el área marcada por una lámpara minimalista de diseño en bronce cálido.' },
  { label: '🧽 Limpiar y alisar suelo / pared', instruction: 'Eliminar cualquier mancha, marca o imperfección en la zona marcada dejando un acabado liso y uniforme.' },
];

export function ImageCreatorEditorModal({
  isOpen,
  onClose,
  initialImage,
  sessionImages = [],
  onAddImageToSession,
  initialTab = 'create',
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inpaintFileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'create' | 'edit' | 'inpaint'>(
    initialImage ? (initialTab || 'edit') : initialTab
  );

  // Tab 1: Create state
  const [createPrompt, setCreatePrompt] = useState('');
  const [createRatio, setCreateRatio] = useState<'1:1' | '4:5' | '9:16' | '16:9'>('4:5');
  const [isCreating, setIsCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ base64: string; mimeType: string } | null>(null);

  // Tab 2: Edit state
  const [selectedSourceImage, setSelectedSourceImage] = useState<MediaItem | null>(initialImage || sessionImages[0] || null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedResult, setEditedResult] = useState<{ base64: string; mimeType: string } | null>(null);
  const [editSliderPos, setEditSliderPos] = useState(50);

  // Tab 3: Inpaint (Pincel Mágico) state
  const [inpaintSourceImage, setInpaintSourceImage] = useState<MediaItem | null>(initialImage || sessionImages[0] || null);
  const [brushSize, setBrushSize] = useState<number>(35);
  const [inpaintInstruction, setInpaintInstruction] = useState<string>('Borrar el objeto marcado y reconstruir el fondo de forma limpia con la textura circundante.');
  const [isInpainting, setIsInpainting] = useState<boolean>(false);
  const [inpaintedResult, setInpaintedResult] = useState<{ base64: string; mimeType: string } | null>(null);
  const [inpaintSliderPos, setInpaintSliderPos] = useState<number>(50);
  const [hasMaskDrawn, setHasMaskDrawn] = useState<boolean>(false);
  const [strictComposite, setStrictComposite] = useState<boolean>(true);

  // Canvas refs for inpaint
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  // Pixel-level compositing: strictly keeps 100% of untouched pixels from the original image
  const compositeInpaintedWithOriginal = async (
    originalBase64: string,
    originalMime: string,
    aiInpaintedBase64: string,
    maskCanvas: HTMLCanvasElement
  ): Promise<string> => {
    return new Promise((resolve) => {
      const origImg = new Image();
      origImg.crossOrigin = 'anonymous';
      origImg.onload = () => {
        const aiImg = new Image();
        aiImg.crossOrigin = 'anonymous';
        aiImg.onload = () => {
          const width = origImg.naturalWidth || maskCanvas.width;
          const height = origImg.naturalHeight || maskCanvas.height;

          // 1. Output canvas starting with 100% pristine original
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = width;
          finalCanvas.height = height;
          const fCtx = finalCanvas.getContext('2d')!;
          fCtx.drawImage(origImg, 0, 0, width, height);

          // 2. Feathered mask
          const featheredMask = document.createElement('canvas');
          featheredMask.width = width;
          featheredMask.height = height;
          const mCtx = featheredMask.getContext('2d')!;
          mCtx.filter = 'blur(6px)';
          mCtx.drawImage(maskCanvas, 0, 0, width, height);

          // 3. Isolated AI patch masked strictly to the feathered painted area
          const patchCanvas = document.createElement('canvas');
          patchCanvas.width = width;
          patchCanvas.height = height;
          const pCtx = patchCanvas.getContext('2d')!;
          pCtx.drawImage(aiImg, 0, 0, width, height);
          pCtx.globalCompositeOperation = 'destination-in';
          pCtx.drawImage(featheredMask, 0, 0, width, height);

          // 4. Composite the AI patch over the original image
          fCtx.drawImage(patchCanvas, 0, 0, width, height);

          const resultDataUrl = finalCanvas.toDataURL('image/png');
          resolve(resultDataUrl.split(',')[1]);
        };
        aiImg.src = `data:image/png;base64,${aiInpaintedBase64}`;
      };
      origImg.src = `data:${originalMime};base64,${originalBase64}`;
    });
  };

  useEffect(() => {
    if (initialImage) {
      setSelectedSourceImage(initialImage);
      setInpaintSourceImage(initialImage);
    }
  }, [initialImage]);

  // Set up canvas when inpaint image changes or tab changes
  useEffect(() => {
    if (activeTab !== 'inpaint' || !inpaintSourceImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `data:${inpaintSourceImage.mimeType};base64,${inpaintSourceImage.base64}`;
    img.onload = () => {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasMaskDrawn(false);
    };
  }, [activeTab, inpaintSourceImage]);

  if (!isOpen) return null;

  // Drawing handlers for inpainting canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.65)'; // Bright translucent red/coral
    ctx.fill();
    ctx.restore();

    setHasMaskDrawn(true);
  };

  const clearCanvasMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasMaskDrawn(false);
  };

  // Upload custom image
  const handleUploadCustomImage = (e: React.ChangeEvent<HTMLInputElement>, target: 'edit' | 'inpaint') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const cleanBase64 = result.split(',')[1];
        const newImg: MediaItem = {
          mediaId: `custom-upload-${Date.now()}`,
          base64: cleanBase64,
          mimeType: file.type || 'image/jpeg',
          type: 'image',
          name: file.name,
        };
        if (target === 'edit') {
          setSelectedSourceImage(newImg);
          setEditedResult(null);
        } else {
          setInpaintSourceImage(newImg);
          setInpaintedResult(null);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  // Tab 1: Create Image
  const handleCreateImage = async () => {
    if (!createPrompt.trim()) return;
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/create-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: createPrompt.trim(),
          aspectRatio: createRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar imagen con gemini-3.1-flash-image-preview');

      setCreatedResult({
        base64: data.base64,
        mimeType: data.mimeType || 'image/png',
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error en el motor de generación.');
    } finally {
      setIsCreating(false);
    }
  };

  // Tab 2: Edit Image
  const handleEditImage = async () => {
    if (!selectedSourceImage || !editPrompt.trim()) return;
    setIsEditing(true);
    setError(null);

    try {
      const res = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedSourceImage.base64,
          mimeType: selectedSourceImage.mimeType,
          editPrompt: editPrompt.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al editar imagen con gemini-3.1-flash-image-preview');

      setEditedResult({
        base64: data.base64,
        mimeType: data.mimeType || 'image/png',
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al procesar la edición.');
    } finally {
      setIsEditing(false);
    }
  };

  // Tab 3: Inpaint Image (Pincel Mágico)
  const handleInpaintImage = async () => {
    if (!inpaintSourceImage) return;
    setIsInpainting(true);
    setError(null);

    try {
      // Export composite image: original image with the mask drawn on it
      const canvas = canvasRef.current;
      let maskOverlayBase64: string | null = null;

      if (canvas && hasMaskDrawn) {
        // Create an overlay image combining original photo and mask strokes
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const eCtx = exportCanvas.getContext('2d');
        if (eCtx) {
          const baseImg = new Image();
          baseImg.crossOrigin = 'anonymous';
          baseImg.src = `data:${inpaintSourceImage.mimeType};base64,${inpaintSourceImage.base64}`;
          await new Promise((resolve) => (baseImg.onload = resolve));
          eCtx.drawImage(baseImg, 0, 0, exportCanvas.width, exportCanvas.height);
          eCtx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
          maskOverlayBase64 = exportCanvas.toDataURL('image/png').split(',')[1];
        }
      }

      const res = await fetch('/api/inpaint-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: inpaintSourceImage.base64,
          maskOverlayBase64,
          instruction: inpaintInstruction,
          mimeType: inpaintSourceImage.mimeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el pincel mágico.');

      let finalBase64 = data.base64;

      // If strict surgical composite is active and we have the user's mask,
      // preserve 100% of the untouched original pixels
      if (strictComposite && canvas && hasMaskDrawn) {
        try {
          finalBase64 = await compositeInpaintedWithOriginal(
            inpaintSourceImage.base64,
            inpaintSourceImage.mimeType,
            data.base64,
            canvas
          );
        } catch (compErr) {
          console.warn('Fallback to direct AI result:', compErr);
        }
      }

      setInpaintedResult({
        base64: finalBase64,
        mimeType: 'image/png',
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al borrar o modificar la zona marcada.');
    } finally {
      setIsInpainting(false);
    }
  };

  // Chain Inpaint
  const handleChainInpaint = () => {
    if (!inpaintedResult) return;
    setInpaintSourceImage({
      mediaId: `chained-inpaint-${Date.now()}`,
      base64: inpaintedResult.base64,
      mimeType: inpaintedResult.mimeType,
      type: 'image',
      name: `Retoque Pincel`,
    });
    setInpaintedResult(null);
    clearCanvasMask();
  };

  const handleSaveToSession = (imgData: { base64: string; mimeType: string }, label: string) => {
    if (!onAddImageToSession) return;
    const newItem: MediaItem = {
      mediaId: `ai-gen-${Date.now()}`,
      base64: imgData.base64,
      mimeType: imgData.mimeType,
      type: 'image',
      name: `AI Studio - ${label}`,
      poseLabel: label,
      aspectRatio: createRatio,
      exif: {
        cameraModel: 'gemini-3.1-flash-image-preview',
        lens: '50mm f/1.2 Creative AI Lens',
        aperture: 'f/1.4',
        shutterSpeed: '1/500s',
        iso: 'ISO 100',
        lightingSetup: 'AI Prompt / Inpaint Retouch',
      },
    };
    onAddImageToSession(newItem);
    onClose();
  };

  const downloadImage = (base64: string, mimeType: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#2b2a27]/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#f5f4ef] rounded-sm max-w-6xl w-full max-h-[94vh] overflow-hidden shadow-2xl border border-[#e5e3da] flex flex-col"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#e5e3da] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#c25e38] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[18px]">
                {activeTab === 'inpaint' ? 'brush' : 'image_edit_auto'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif italic text-xl font-bold text-[#1c1917]">
                  {activeTab === 'inpaint'
                    ? 'Pincel Mágico & Borrador de Objetos'
                    : 'Crear & Editar Imágenes con IA'}
                </h3>
                <span className="text-[9px] font-mono uppercase bg-[#2b2a27] text-white px-2 py-0.5 rounded-2xs">
                  gemini-3.1-flash-image-preview
                </span>
              </div>
              <p className="text-xs text-[#78716c]">
                {activeTab === 'inpaint'
                  ? 'Pinta sobre cualquier objeto (ej: maceta, cables, personas) para borrarlo o reemplazarlo de la foto.'
                  : 'Genera tomas editoriales desde cero o modifica cualquier foto usando lenguaje natural.'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#f5f4ef] p-1 rounded-full border border-[#e5e3da] text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('inpaint')}
              className={`px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'inpaint'
                  ? 'bg-[#c25e38] text-white shadow-xs'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">brush</span>
              <span>Pincel Mágico (Borrar Áreas)</span>
            </button>

            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'edit'
                  ? 'bg-[#2b2a27] text-white shadow-xs'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              <span>Editar con Prompt</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'create'
                  ? 'bg-[#2b2a27] text-white shadow-xs'
                  : 'text-[#78716c] hover:text-[#1c1917]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
              <span>Crear Imagen</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 ml-1 rounded-full border border-[#e5e3da] flex items-center justify-center text-[#78716c] hover:text-[#1c1917]"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#f5f4ef]">
          {activeTab === 'inpaint' ? (
            /* TAB 3: PINCEL MÁGICO / INPAINTING (BORRAR PLANTERA, OBJETOS, ETC.) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Image Canvas & Brush Controls */}
              <div className="lg:col-span-7 bg-white p-6 rounded-sm border border-[#e5e3da] shadow-2xs space-y-4">
                {/* Select Image Strip */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#c25e38]">brush</span>
                      <span>1. Pinta sobre lo que deseas borrar o modificar</span>
                    </label>
                    <input
                      ref={inpaintFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadCustomImage(e, 'inpaint')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => inpaintFileInputRef.current?.click()}
                      className="text-[10px] text-[#c25e38] hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">upload</span>
                      Subir otra foto
                    </button>
                  </div>

                  {sessionImages.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {sessionImages.map((img, i) => (
                        <button
                          key={img.mediaId || i}
                          type="button"
                          onClick={() => {
                            setInpaintSourceImage(img);
                            setInpaintedResult(null);
                          }}
                          className={`w-12 h-12 rounded-xs overflow-hidden shrink-0 border-2 transition-all ${
                            inpaintSourceImage?.mediaId === img.mediaId
                              ? 'border-[#c25e38] ring-2 ring-[#c25e38]/30 scale-105'
                              : 'border-[#e5e3da] opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={`data:${img.mimeType};base64,${img.base64}`}
                            alt="thumb"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interactive Drawing Canvas Layer */}
                <div className="relative aspect-[4/5] max-h-[50vh] bg-black rounded-xs overflow-hidden select-none border border-[#e5e3da] flex items-center justify-center">
                  {inpaintSourceImage ? (
                    <>
                      <img
                        src={`data:${inpaintSourceImage.mimeType};base64,${inpaintSourceImage.base64}`}
                        alt="Foto base"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                      {/* Drawing canvas overlay */}
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onMouseMove={draw}
                        onTouchStart={startDrawing}
                        onTouchEnd={stopDrawing}
                        onTouchMove={draw}
                        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                      />

                      <div className="absolute top-3 left-3 bg-[#2b2a27]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase pointer-events-none">
                        🖌️ Pinta sobre el objeto a borrar
                      </div>
                    </>
                  ) : (
                    <div className="text-white text-xs">Carga o selecciona una foto</div>
                  )}
                </div>

                {/* Brush size & actions toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#e5e3da]">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">brush</span>
                      Grosor:
                    </span>
                    <input
                      type="range"
                      min="10"
                      max="75"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-24 md:w-32 accent-[#c25e38]"
                    />
                    <span className="text-xs font-mono font-bold text-[#78716c]">{brushSize}px</span>
                  </div>

                  <button
                    type="button"
                    onClick={clearCanvasMask}
                    disabled={!hasMaskDrawn}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border transition-all flex items-center gap-1 ${
                      hasMaskDrawn
                        ? 'border-[#e5e3da] hover:border-red-500 text-red-600 cursor-pointer'
                        : 'border-[#e5e3da]/40 text-[#78716c]/40 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">cleaning_services</span>
                    Limpiar Pinceladas
                  </button>
                </div>
              </div>

              {/* Right Column: Instruction & Inpaint Result */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-6 rounded-sm border border-[#e5e3da] shadow-2xs space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#c25e38]">magic_button</span>
                      <span>2. ¿Qué hacer con el área marcada?</span>
                    </label>
                    <textarea
                      rows={2}
                      value={inpaintInstruction}
                      onChange={(e) => setInpaintInstruction(e.target.value)}
                      placeholder="Ej: Borrar la maceta y rellenar con el piso de madera idéntico..."
                      className="w-full text-xs p-3 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38] resize-none leading-relaxed"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716c]">
                      Acciones rápidas frecuentes:
                    </span>
                    <div className="space-y-1">
                      {SAMPLE_INPAINT_ACTIONS.map((action, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setInpaintInstruction(action.instruction)}
                          className="w-full text-left p-2 rounded-sm border border-[#e5e3da] hover:border-[#c25e38] bg-[#f5f4ef] hover:bg-stone-100 text-xs text-[#2b2a27] transition-all flex items-center gap-1.5"
                        >
                          <span className="text-xs">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Surgical Pixel-Fidelity Protection Banner & Toggle */}
                  <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-sm p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                        <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified_user</span>
                        <span>Fusión Quirúrgica Píxel Fiel</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={strictComposite}
                          onChange={(e) => setStrictComposite(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-snug">
                      {strictComposite
                        ? '🛡️ Activa: El 100% de la foto fuera del trazo rojo (rostro, piel, ropa, fondo no pintado) permanece estrictamente idéntico píxel por píxel. No se arruina ni se re-genera el resto.'
                        : 'Permite a la IA armonizar la luz global de toda la toma.'}
                    </p>
                  </div>

                  {/* Trigger Button */}
                  <button
                    type="button"
                    onClick={handleInpaintImage}
                    disabled={!inpaintSourceImage || isInpainting}
                    className={`w-full py-3.5 rounded-full font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
                      !inpaintSourceImage || isInpainting
                        ? 'bg-stone-200 text-[#78716c] cursor-not-allowed'
                        : 'bg-[#c25e38] hover:bg-[#a64d2b] text-white shadow-md cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      {isInpainting ? 'sync' : 'auto_fix_high'}
                    </span>
                    <span>
                      {isInpainting
                        ? 'Reconstruyendo zona con Gemini...'
                        : 'Borrar / Modificar Zona Marcada'}
                    </span>
                  </button>
                </div>

                {/* Result box with Before / After Split Slider */}
                {inpaintedResult && inpaintSourceImage && (
                  <div className="bg-white p-4 rounded-sm border border-[#e5e3da] shadow-lg space-y-3 animate-in fade-in">
                    <div className="relative aspect-[4/5] max-h-[42vh] bg-black rounded-xs overflow-hidden select-none">
                      {/* Inpainted Image (Background) */}
                      <img
                        src={`data:${inpaintedResult.mimeType};base64,${inpaintedResult.base64}`}
                        alt="Resultado retocado"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <span className="absolute top-3 right-3 bg-[#c25e38]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase z-10">
                        Objeto Eliminado / Retocado
                      </span>

                      {/* Original (Clipped) */}
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none"
                        style={{ clipPath: `inset(0 ${100 - inpaintSliderPos}% 0 0)` }}
                      >
                        <img
                          src={`data:${inpaintSourceImage.mimeType};base64,${inpaintSourceImage.base64}`}
                          alt="Original"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 bg-[#2b2a27]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase z-10">
                          Original con objeto
                        </span>
                      </div>

                      {/* Divider */}
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                        style={{ left: `${inpaintSliderPos}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-[#2b2a27] shadow-xl flex items-center justify-center font-bold text-[10px]">
                          ↔
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={inpaintSliderPos}
                        onChange={(e) => setInpaintSliderPos(Number(e.target.value))}
                        className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            downloadImage(
                              inpaintedResult.base64,
                              inpaintedResult.mimeType,
                              `Retoque_Pincel_${Date.now()}.png`
                            )
                          }
                          className="px-3 py-1.5 border border-[#e5e3da] hover:bg-stone-50 text-[#2b2a27] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                        >
                          <span className="material-symbols-outlined text-[15px]">download</span>
                          Descargar
                        </button>

                        <button
                          onClick={handleChainInpaint}
                          title="Seguir borrando otros objetos sobre esta imagen"
                          className="px-3 py-1.5 bg-[#f5f4ef] hover:bg-stone-200 text-[#2b2a27] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                        >
                          <span className="material-symbols-outlined text-[15px]">autorenew</span>
                          Seguir Borrando
                        </button>
                      </div>

                      {onAddImageToSession && (
                        <button
                          onClick={() => handleSaveToSession(inpaintedResult, 'Retoque Pincel')}
                          className="px-4 py-1.5 bg-[#c25e38] hover:bg-[#a64d2b] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-md transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">add_photo_alternate</span>
                          Guardar en Galería
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'edit' ? (
            /* TAB 2: EDIT EXISTING IMAGE WITH PROMPT */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Image Selector & Edit Prompt */}
              <div className="lg:col-span-6 bg-white p-6 rounded-sm border border-[#e5e3da] shadow-2xs space-y-5">
                {/* Select Image to Edit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#c25e38]">photo_library</span>
                      <span>1. Elige la foto a modificar</span>
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadCustomImage(e, 'edit')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] text-[#c25e38] hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">upload</span>
                      Subir otra foto
                    </button>
                  </div>

                  {sessionImages.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {sessionImages.map((img, i) => (
                        <button
                          key={img.mediaId || i}
                          type="button"
                          onClick={() => {
                            setSelectedSourceImage(img);
                            setEditedResult(null);
                          }}
                          className={`w-14 h-14 rounded-xs overflow-hidden shrink-0 border-2 transition-all ${
                            selectedSourceImage?.mediaId === img.mediaId
                              ? 'border-[#c25e38] ring-2 ring-[#c25e38]/30 scale-105'
                              : 'border-[#e5e3da] opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={`data:${img.mimeType};base64,${img.base64}`}
                            alt="thumb"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Edit Prompt Field */}
                <div className="space-y-1.5 pt-2 border-t border-[#e5e3da]">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#c25e38]">auto_fix_high</span>
                    <span>2. ¿Qué deseas editar o cambiar en esta foto?</span>
                  </label>
                  <textarea
                    rows={3}
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Ej: Añade un collar de perlas elegante al cuello de la modelo y cambia el fondo por un jardín botánico desenfocado..."
                    className="w-full text-xs p-3 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38] resize-none leading-relaxed"
                  />
                </div>

                {/* Edit Suggestion Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716c]">
                    Ediciones populares:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_EDIT_PROMPTS.map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEditPrompt(sample)}
                        className="text-[10px] text-left p-1.5 bg-[#f5f4ef] hover:bg-stone-200 border border-[#e5e3da] rounded-2xs text-[#2b2a27] transition-all line-clamp-1"
                      >
                        ✨ {sample}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={handleEditImage}
                  disabled={!selectedSourceImage || !editPrompt.trim() || isEditing}
                  className={`w-full py-3.5 rounded-full font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
                    !selectedSourceImage || !editPrompt.trim() || isEditing
                      ? 'bg-stone-200 text-[#78716c] cursor-not-allowed'
                      : 'bg-[#c25e38] hover:bg-[#a64d2b] text-white shadow-md cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {isEditing ? 'sync' : 'auto_fix_high'}
                  </span>
                  <span>{isEditing ? 'Aplicando Edición con Gemini...' : 'Editar Imagen con Prompt'}</span>
                </button>
              </div>

              {/* Right Column: Split Comparison or Preview */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center">
                {editedResult && selectedSourceImage ? (
                  <div className="w-full bg-white p-4 rounded-sm border border-[#e5e3da] shadow-lg space-y-3">
                    <div className="relative aspect-[4/5] max-h-[55vh] bg-black rounded-xs overflow-hidden select-none">
                      {/* Edited Image (Background) */}
                      <img
                        src={`data:${editedResult.mimeType};base64,${editedResult.base64}`}
                        alt="Resultado editado"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <span className="absolute top-3 right-3 bg-[#c25e38]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase z-10">
                        Editada con IA
                      </span>

                      {/* Original Source Image (Clipped) */}
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none"
                        style={{ clipPath: `inset(0 ${100 - editSliderPos}% 0 0)` }}
                      >
                        <img
                          src={`data:${selectedSourceImage.mimeType};base64,${selectedSourceImage.base64}`}
                          alt="Original"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 bg-[#2b2a27]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase z-10">
                          Original
                        </span>
                      </div>

                      {/* Divider line */}
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                        style={{ left: `${editSliderPos}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-[#2b2a27] shadow-xl flex items-center justify-center font-bold text-xs">
                          ↔
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editSliderPos}
                        onChange={(e) => setEditSliderPos(Number(e.target.value))}
                        className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            downloadImage(
                              editedResult.base64,
                              editedResult.mimeType,
                              `AI_Editada_${Date.now()}.png`
                            )
                          }
                          className="px-3.5 py-1.5 border border-[#e5e3da] hover:bg-stone-50 text-[#2b2a27] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                        >
                          <span className="material-symbols-outlined text-[15px]">download</span>
                          Descargar
                        </button>
                      </div>

                      {onAddImageToSession && (
                        <button
                          onClick={() => handleSaveToSession(editedResult, `Edición: ${editPrompt.slice(0, 15)}`)}
                          className="px-4 py-1.5 bg-[#c25e38] hover:bg-[#a64d2b] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-md transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">add_photo_alternate</span>
                          Guardar en Galería
                        </button>
                      )}
                    </div>
                  </div>
                ) : selectedSourceImage ? (
                  <div className="w-full bg-white p-4 rounded-sm border border-[#e5e3da] shadow-md space-y-2">
                    <div className="relative aspect-[4/5] max-h-[55vh] bg-black rounded-xs overflow-hidden flex items-center justify-center">
                      <img
                        src={`data:${selectedSourceImage.mimeType};base64,${selectedSourceImage.base64}`}
                        alt="Foto seleccionada"
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute top-3 left-3 bg-[#2b2a27]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase">
                        Foto base para editar
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[4/5] max-h-[55vh] border-2 border-dashed border-[#e5e3da] bg-white/60 rounded-sm flex flex-col items-center justify-center p-8 text-center text-[#78716c]">
                    <span className="material-symbols-outlined text-5xl mb-3 text-stone-300">
                      add_photo_alternate
                    </span>
                    <p className="font-serif italic text-lg text-[#2b2a27]">
                      Selecciona una foto para editar
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 1: CREATE IMAGE FROM TEXT PROMPT */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Prompting & Config */}
              <div className="lg:col-span-6 bg-white p-6 rounded-sm border border-[#e5e3da] shadow-2xs space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#c25e38]">edit_note</span>
                    <span>1. Describe la imagen que deseas crear</span>
                  </label>
                  <textarea
                    rows={4}
                    value={createPrompt}
                    onChange={(e) => setCreatePrompt(e.target.value)}
                    placeholder="Ej: Modelo luciendo un vestido de alta costura negro en un estudio con iluminación dramática de claroscuro y textura de tela nítida..."
                    className="w-full text-xs p-3 border border-[#e5e3da] rounded-sm focus:outline-none focus:border-[#c25e38] resize-none leading-relaxed"
                  />
                </div>

                {/* Sample Prompt Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716c]">
                    Ideas y estilos rápidos:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_CREATE_PROMPTS.map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCreatePrompt(sample)}
                        className="text-[10px] text-left p-1.5 bg-[#f5f4ef] hover:bg-stone-200 border border-[#e5e3da] rounded-2xs text-[#2b2a27] transition-all line-clamp-1"
                      >
                        💡 {sample}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="space-y-2 pt-2 border-t border-[#e5e3da]">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#1c1917]">
                    2. Proporción de la Imagen (Aspect Ratio)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: '1:1', label: '1:1 Cuadrado' },
                      { id: '4:5', label: '4:5 Editorial' },
                      { id: '9:16', label: '9:16 Historia' },
                      { id: '16:9', label: '16:9 Panorámica' },
                    ].map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => setCreateRatio(ratio.id as any)}
                        className={`py-2 text-[10px] font-bold uppercase rounded-sm border transition-all ${
                          createRatio === ratio.id
                            ? 'bg-[#2b2a27] text-white border-[#2b2a27]'
                            : 'border-[#e5e3da] text-[#78716c] hover:border-[#78716c] bg-white'
                        }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={handleCreateImage}
                  disabled={!createPrompt.trim() || isCreating}
                  className={`w-full py-3.5 rounded-full font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
                    !createPrompt.trim() || isCreating
                      ? 'bg-stone-200 text-[#78716c] cursor-not-allowed'
                      : 'bg-[#2b2a27] hover:bg-[#c25e38] text-white shadow-md cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {isCreating ? 'sync' : 'auto_awesome'}
                  </span>
                  <span>{isCreating ? 'Generando con Gemini Preview...' : 'Crear Fotografía con IA'}</span>
                </button>
              </div>

              {/* Right Column: Result Viewport */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center">
                {createdResult ? (
                  <div className="w-full bg-white p-4 rounded-sm border border-[#e5e3da] shadow-lg space-y-3">
                    <div className="relative aspect-[4/5] max-h-[55vh] bg-black rounded-xs overflow-hidden flex items-center justify-center">
                      <img
                        src={`data:${createdResult.mimeType};base64,${createdResult.base64}`}
                        alt="Resultado creado"
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute top-3 left-3 bg-[#2b2a27]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-2xs uppercase">
                        Generada con gemini-3.1-flash-image-preview
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button
                        onClick={() =>
                          downloadImage(
                            createdResult.base64,
                            createdResult.mimeType,
                            `AI_Creacion_${Date.now()}.png`
                          )
                        }
                        className="px-4 py-2 border border-[#e5e3da] hover:bg-stone-50 text-[#2b2a27] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Descargar
                      </button>

                      {onAddImageToSession && (
                        <button
                          onClick={() => handleSaveToSession(createdResult, 'Nueva Creación IA')}
                          className="px-5 py-2 bg-[#c25e38] hover:bg-[#a64d2b] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                          Añadir a la Galería
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[4/5] max-h-[55vh] border-2 border-dashed border-[#e5e3da] bg-white/60 rounded-sm flex flex-col items-center justify-center p-8 text-center text-[#78716c]">
                    <span className="material-symbols-outlined text-5xl mb-3 text-stone-300">
                      image
                    </span>
                    <p className="font-serif italic text-lg text-[#2b2a27]">
                      Tu imagen generada aparecerá aquí
                    </p>
                    <p className="text-xs max-w-xs mt-1">
                      Escribe un prompt en el panel izquierdo y haz clic en "Crear Fotografía".
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
