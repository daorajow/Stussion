import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { StudioHeader } from './components/StudioHeader';
import { ReferenceSelector } from './components/ReferenceSelector';
import { SessionConfig } from './components/SessionConfig';
import { GenerationOverlay } from './components/GenerationOverlay';
import { SessionGallery } from './components/SessionGallery';
import { RawPhotoEnhancer } from './components/RawPhotoEnhancer';
import { BatchRetouchView } from './components/BatchRetouchView';
import { ClientProofingView } from './components/ClientProofingView';
import { PoseGuideModal } from './components/PoseGuideModal';
import { WatermarkModal } from './components/WatermarkModal';
import { ImageCreatorEditorModal } from './components/ImageCreatorEditorModal';
import { IntroModal } from './components/IntroModal';
import { MediaItem, PoseType, AspectRatioType, WatermarkConfig, PhotoExifData } from './types';
import {
  AESTHETIC_PRESETS,
  LIGHTING_OPTIONS,
  CAMERA_OPTIONS,
  LOCATION_OPTIONS,
} from './data/presets';

const POSES: PoseType[] = [
  {
    id: 'portrait',
    label: 'Retrato de Rostro',
    category: 'portrait',
    prompt:
      'a high-end professional beauty portrait, close up on face, neutral studio background, editorial lighting, pristine skin texture',
    icon: 'face',
  },
  {
    id: 'full-body',
    label: 'Cuerpo Completo',
    category: 'full',
    prompt:
      'full body fashion shot, standing pose, walking towards camera, high fashion designer outfit, studio background, elegant poise',
    icon: 'accessibility_new',
  },
  {
    id: 'side-profile',
    label: 'Perfil Lateral',
    category: 'profile',
    prompt:
      'dramatic side profile shot, cinematic rim lighting, looking away from camera, professional high fashion photography',
    icon: 'side_navigation',
  },
  {
    id: 'action',
    label: 'Posado Dinámico',
    category: 'action',
    prompt:
      'dynamic action pose, mid-motion, movement, hair flowing, energetic editorial shot, high shutter speed, dramatic shadows',
    icon: 'directions_run',
  },
  {
    id: 'sitting',
    label: 'Posado Sentado',
    category: 'lifestyle',
    prompt:
      'sophisticated sitting pose on a minimalist designer chair, relaxed but elegant posture, luxury studio setting',
    icon: 'chair',
  },
];

const STORAGE_KEY = 'studio_session_pro_cache';
const WATERMARK_KEY = 'studio_watermark_pro';

export default function App() {
  const [activeMode, setActiveMode] = useState<'lookbook' | 'batch-retouch' | 'raw-enhancer' | 'client-view'>('lookbook');
  const [showIntro, setShowIntro] = useState(false);
  const [showPoseGuide, setShowPoseGuide] = useState(false);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [showImageCreatorEditorModal, setShowImageCreatorEditorModal] = useState(false);
  const [imageModalTab, setImageModalTab] = useState<'create' | 'edit' | 'inpaint'>('create');
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<MediaItem | null>(null);

  // Watermark Configuration
  const [watermark, setWatermark] = useState<WatermarkConfig>({
    enabled: false,
    text: '© Studio Session Pro Fotografía',
    position: 'bottom-right',
    opacity: 0.7,
    fontStyle: 'serif',
  });

  // Lookbook session state
  const [references, setReferences] = useState<MediaItem[]>([]);
  const [selectedPoses, setSelectedPoses] = useState<string[]>(['portrait', 'full-body']);
  const [customDescription, setCustomDescription] = useState('');
  const [selectedAesthetic, setSelectedAesthetic] = useState<string>('quiet-luxury');
  const [selectedLighting, setSelectedLighting] = useState<string>('rembrandt');
  const [selectedCamera, setSelectedCamera] = useState<string>('hasselblad');
  const [selectedLocation, setSelectedLocation] = useState<string>('cyclorama');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('4:5');
  const [shotOverrides, setShotOverrides] = useState<Record<string, string>>({});

  const [generatedImages, setGeneratedImages] = useState<MediaItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Restore saved session & watermark from LocalStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.generatedImages) && parsed.generatedImages.length > 0) {
          setGeneratedImages(parsed.generatedImages);
        }
        if (Array.isArray(parsed.references) && parsed.references.length > 0) {
          setReferences(parsed.references);
        }
        if (parsed.customDescription) setCustomDescription(parsed.customDescription);
        if (parsed.selectedAesthetic) setSelectedAesthetic(parsed.selectedAesthetic);
        if (parsed.selectedLighting) setSelectedLighting(parsed.selectedLighting);
        if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
      }

      const cachedWatermark = localStorage.getItem(WATERMARK_KEY);
      if (cachedWatermark) {
        setWatermark(JSON.parse(cachedWatermark));
      }
    } catch (err) {
      console.warn('Failed to parse cached studio session:', err);
    }
  }, []);

  // Save active session to LocalStorage
  useEffect(() => {
    try {
      if (generatedImages.length > 0 || references.length > 0) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            generatedImages,
            references: references.slice(0, 3),
            customDescription,
            selectedAesthetic,
            selectedLighting,
            aspectRatio,
          })
        );
      }
    } catch (err) {
      console.warn('Failed to write session cache to localStorage:', err);
    }
  }, [generatedImages, references, customDescription, selectedAesthetic, selectedLighting, aspectRatio]);

  const handleUpdateWatermark = (newConfig: WatermarkConfig) => {
    setWatermark(newConfig);
    try {
      localStorage.setItem(WATERMARK_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Could not save watermark to localStorage', e);
    }
  };

  const handleUpdateImageMetadata = (mediaId: string, updatedExif: PhotoExifData) => {
    setGeneratedImages((prev) =>
      prev.map((img) => (img.mediaId === mediaId ? { ...img, exif: updatedExif } : img))
    );
  };

  const handleAddImageToSession = (newImage: MediaItem) => {
    setGeneratedImages((prev) => [newImage, ...prev]);
  };

  const handleAddBatchToSession = (items: MediaItem[]) => {
    setGeneratedImages((prev) => [...items, ...prev]);
  };

  const handleOpenEditWithAI = (img: MediaItem) => {
    setSelectedImageForEdit(img);
    setImageModalTab('edit');
    setShowImageCreatorEditorModal(true);
  };

  const handleOpenInpaint = (img: MediaItem) => {
    setSelectedImageForEdit(img);
    setImageModalTab('inpaint');
    setShowImageCreatorEditorModal(true);
  };

  const handleShotOverrideChange = (poseId: string, val: string) => {
    setShotOverrides((prev) => ({ ...prev, [poseId]: val }));
  };

  const toggleFavoriteImage = (mediaId: string) => {
    setGeneratedImages((prev) =>
      prev.map((img) => (img.mediaId === mediaId ? { ...img, isFavorite: !img.isFavorite } : img))
    );
  };

  const handleApplyPoseToStudio = (prompt: string, title: string) => {
    setCustomDescription((prev) => (prev ? `${prev}. Pose: ${prompt}` : `Pose: ${prompt}`));
    setActiveMode('lookbook');
  };

  const startSession = async () => {
    if (references.length === 0 || selectedPoses.length === 0) return;
    setIsGenerating(true);
    setError(null);
    setCurrentProgress(5);
    setCurrentStepText('Iniciando calibración de lentes y referencias del sujeto...');

    const aestheticObj = AESTHETIC_PRESETS.find((a) => a.id === selectedAesthetic);
    const lightingObj = LIGHTING_OPTIONS.find((l) => l.id === selectedLighting);
    const cameraObj = CAMERA_OPTIONS.find((c) => c.id === selectedCamera);
    const locationObj = LOCATION_OPTIONS.find((loc) => loc.id === selectedLocation);

    const results: MediaItem[] = [];

    try {
      for (let i = 0; i < selectedPoses.length; i++) {
        const poseId = selectedPoses[i];
        const pose = POSES.find((p) => p.id === poseId);
        const poseProgress = Math.round(((i) / selectedPoses.length) * 90) + 5;
        setCurrentProgress(poseProgress);
        setCurrentStepText(`Revelando toma ${i + 1} de ${selectedPoses.length}: ${pose?.label}...`);

        const response = await fetch('/api/generate-pose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: pose?.prompt || 'professional fashion photograph',
            customDescription,
            selectedAestheticPrompt: aestheticObj?.promptSnippet,
            selectedLightingPrompt: lightingObj?.promptSnippet,
            selectedCameraPrompt: cameraObj?.promptSnippet,
            selectedLocationPrompt: locationObj?.promptSnippet,
            shotOverride: shotOverrides[poseId] || '',
            referenceImages: references.map((r) => ({
              base64: r.base64,
              mimeType: r.mimeType,
            })),
            poseId,
            poseLabel: pose?.label || 'Editorial Shot',
            aspectRatio,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Error al generar la toma ${pose?.label}`);
        }

        results.push({
          mediaId: data.mediaId || `shot-${Date.now()}-${i}`,
          base64: data.base64,
          mimeType: data.mimeType || 'image/png',
          type: 'image',
          name: `Studio Session - ${pose?.label}`,
          poseId,
          poseLabel: pose?.label,
          aspectRatio,
          isFavorite: false,
          exif: {
            cameraModel: cameraObj?.label || 'Hasselblad H6D-100c',
            lens: poseId === 'portrait' ? '85mm f/1.4' : poseId === 'full-body' ? '35mm f/1.4' : '50mm f/1.2',
            aperture: poseId === 'portrait' ? 'f/1.8' : 'f/2.8',
            shutterSpeed: poseId === 'action' ? '1/1000s' : '1/500s',
            iso: 'ISO 100',
            lightingSetup: lightingObj?.label || 'Studio Lighting',
            colorSpace: 'sRGB / Display P3',
            photographer: watermark.enabled && watermark.text ? watermark.text.replace(/^[©\s]+/, '') : 'Studio Session Pro',
          },
        });
      }

      setCurrentProgress(100);
      setCurrentStepText('¡Sesión revelada con éxito!');
      await new Promise((r) => setTimeout(r, 600));
      setGeneratedImages(results);
    } catch (err: any) {
      console.error('Session generation error:', err);
      setError(
        err?.message ||
          'Hubo un problema al contactar con el motor de generación. Por favor, intenta de nuevo.'
      );
    } finally {
      setIsGenerating(false);
      setCurrentProgress(0);
      setCurrentStepText('');
    }
  };

  const handleRegenerateSingleShot = async (imgToRegenerate: MediaItem) => {
    const poseId = imgToRegenerate.poseId || 'portrait';
    const pose = POSES.find((p) => p.id === poseId) || POSES[0];

    const aestheticObj = AESTHETIC_PRESETS.find((a) => a.id === selectedAesthetic);
    const lightingObj = LIGHTING_OPTIONS.find((l) => l.id === selectedLighting);
    const cameraObj = CAMERA_OPTIONS.find((c) => c.id === selectedCamera);
    const locationObj = LOCATION_OPTIONS.find((loc) => loc.id === selectedLocation);

    try {
      const response = await fetch('/api/generate-pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: pose.prompt,
          customDescription,
          selectedAestheticPrompt: aestheticObj?.promptSnippet,
          selectedLightingPrompt: lightingObj?.promptSnippet,
          selectedCameraPrompt: cameraObj?.promptSnippet,
          selectedLocationPrompt: locationObj?.promptSnippet,
          shotOverride: shotOverrides[poseId] || '',
          referenceImages: references.map((r) => ({
            base64: r.base64,
            mimeType: r.mimeType,
          })),
          poseId,
          poseLabel: pose.label,
          aspectRatio,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo regenerar la toma');
      }

      const updatedShot: MediaItem = {
        mediaId: data.mediaId || `shot-${Date.now()}`,
        base64: data.base64,
        mimeType: data.mimeType || 'image/png',
        type: 'image',
        name: `Studio Session - ${pose.label}`,
        poseId,
        poseLabel: pose.label,
        aspectRatio,
        isFavorite: imgToRegenerate.isFavorite,
        exif: imgToRegenerate.exif,
      };

      setGeneratedImages((prev) =>
        prev.map((item) => (item.mediaId === imgToRegenerate.mediaId ? updatedShot : item))
      );
    } catch (err: any) {
      console.error('Error re-shooting single shot:', err);
      setError(err?.message || 'Error al re-disparar la toma.');
    }
  };

  const resetSession = () => {
    setGeneratedImages([]);
    setReferences([]);
    setCustomDescription('');
    setShotOverrides({});
    setSelectedPoses(['portrait', 'full-body']);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-[#f5f4ef] text-[#2b2a27] font-sans selection:bg-[#c25e38] selection:text-white flex flex-col justify-between">
      <div>
        <StudioHeader
          activeMode={activeMode}
          onModeChange={setActiveMode}
          onInfoClick={() => setShowIntro(true)}
          onOpenPoseGuide={() => setShowPoseGuide(true)}
          onOpenWatermark={() => setShowWatermarkModal(true)}
          onOpenImageEditor={() => {
            setSelectedImageForEdit(null);
            setImageModalTab('create');
            setShowImageCreatorEditorModal(true);
          }}
          watermarkEnabled={watermark.enabled}
          onReset={generatedImages.length > 0 ? resetSession : undefined}
          hasImages={generatedImages.length > 0}
        />

        <main className="max-w-6xl mx-auto p-4 md:p-10 pb-24">
          {activeMode === 'client-view' ? (
            <ClientProofingView
              images={generatedImages}
              onToggleFavorite={toggleFavoriteImage}
              onExitClientMode={() => setActiveMode('lookbook')}
            />
          ) : activeMode === 'batch-retouch' ? (
            <BatchRetouchView
              currentAestheticId={selectedAesthetic}
              onAddToSessionGallery={handleAddBatchToSession}
              onSwitchToLookbook={() => setActiveMode('lookbook')}
            />
          ) : activeMode === 'raw-enhancer' ? (
            <RawPhotoEnhancer
              watermarkConfig={watermark}
              onUpdateWatermark={handleUpdateWatermark}
            />
          ) : (
            <AnimatePresence mode="wait">
              {generatedImages.length === 0 ? (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-12"
                >
                  {/* Paso 01: Referencias */}
                  <div className="lg:col-span-5 space-y-8">
                    <ReferenceSelector
                      references={references}
                      onReferencesChange={setReferences}
                    />
                  </div>

                  {/* Paso 02 & 03: Suite de Dirección y Configuración */}
                  <div className="lg:col-span-7 space-y-8">
                    <SessionConfig
                      poses={POSES}
                      selectedPoses={selectedPoses}
                      customDescription={customDescription}
                      selectedAesthetic={selectedAesthetic}
                      selectedLighting={selectedLighting}
                      selectedCamera={selectedCamera}
                      selectedLocation={selectedLocation}
                      aspectRatio={aspectRatio}
                      shotOverrides={shotOverrides}
                      onTogglePose={(id) =>
                        setSelectedPoses((prev) =>
                          prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
                        )
                      }
                      onDescriptionChange={setCustomDescription}
                      onAestheticChange={setSelectedAesthetic}
                      onLightingChange={setSelectedLighting}
                      onCameraChange={setSelectedCamera}
                      onLocationChange={setSelectedLocation}
                      onAspectRatioChange={setAspectRatio}
                      onShotOverrideChange={handleShotOverrideChange}
                      onStart={startSession}
                      isDisabled={references.length === 0 || selectedPoses.length === 0}
                      referencesCount={references.length}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-12"
                >
                  <SessionGallery
                    images={generatedImages}
                    references={references}
                    onNewSession={resetSession}
                    onRegenerateShot={handleRegenerateSingleShot}
                    onUpdateImageMetadata={handleUpdateImageMetadata}
                    onEditWithAI={handleOpenEditWithAI}
                    onInpaintArea={handleOpenInpaint}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Overlays & Modals */}
      <AnimatePresence>
        {isGenerating && (
          <GenerationOverlay
            progress={currentProgress}
            currentStepText={currentStepText}
          />
        )}
        {showIntro && <IntroModal onClose={() => setShowIntro(false)} />}
      </AnimatePresence>

      {/* Pose Guide Cheatsheet Modal */}
      <PoseGuideModal
        isOpen={showPoseGuide}
        onClose={() => setShowPoseGuide(false)}
        onSelectPoseToStudio={handleApplyPoseToStudio}
      />

      {/* Watermark Configuration Modal */}
      <WatermarkModal
        isOpen={showWatermarkModal}
        onClose={() => setShowWatermarkModal(false)}
        config={watermark}
        onChange={handleUpdateWatermark}
      />

      {/* AI Image Creator & Editor Modal (gemini-3.1-flash-image-preview) */}
      <ImageCreatorEditorModal
        isOpen={showImageCreatorEditorModal}
        onClose={() => setShowImageCreatorEditorModal(false)}
        initialImage={selectedImageForEdit}
        sessionImages={generatedImages}
        onAddImageToSession={handleAddImageToSession}
        initialTab={imageModalTab}
      />

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 max-w-md w-full px-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-red-50 border border-red-200 text-red-800 px-5 py-3.5 rounded-sm shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-red-600 text-xl shrink-0">
                error
              </span>
              <p className="text-xs leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-800 p-1 shrink-0"
              title="Cerrar notificación"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
