export interface PhotoExifData {
  cameraModel: string;
  lens: string;
  aperture: string;
  shutterSpeed: string;
  iso?: string;
  lightingSetup?: string;
  colorSpace?: string;
  photographer?: string;
}

export interface MediaItem {
  mediaId: string;
  base64: string;
  mimeType: string;
  type: 'image';
  name: string;
  aspectRatio?: string;
  poseLabel?: string;
  poseId?: string;
  promptUsed?: string;
  customShotPrompt?: string;
  isFavorite?: boolean;
  exif?: PhotoExifData;
}

export interface PoseType {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  category: 'portrait' | 'full' | 'profile' | 'action' | 'lifestyle';
  description?: string;
}

export interface AestheticPreset {
  id: string;
  label: string;
  category: string;
  description: string;
  promptSnippet: string;
  accentColor: string;
}

export interface LightingOption {
  id: string;
  label: string;
  icon: string;
  description: string;
  promptSnippet: string;
}

export interface CameraOption {
  id: string;
  label: string;
  description: string;
  promptSnippet: string;
}

export interface LocationOption {
  id: string;
  label: string;
  description: string;
  promptSnippet: string;
}

export type AspectRatioType = '4:5' | '9:16' | '1:1' | '16:9';

export interface StudioSessionOptions {
  customDescription: string;
  selectedAesthetic: string;
  selectedLighting: string;
  selectedCamera: string;
  selectedLocation: string;
  aspectRatio: AspectRatioType;
  shotOverrides: Record<string, string>;
}

// Photographer Raw Grading Types
export interface RawPresetOption {
  id: string;
  name: string;
  category: 'prewedding' | 'editorial' | 'film' | 'bw';
  description: string;
  colorGradePrompt: string;
  tags: string[];
  badgeColor: string;
}

export interface SkyOption {
  id: string;
  label: string;
  description: string;
  promptSnippet: string;
  icon: string;
}

export interface GradedResultItem {
  id: string;
  originalBase64: string;
  gradedBase64: string;
  presetName: string;
  mimeType: string;
  timestamp: number;
  skyUsed?: string;
  isFavorite?: boolean;
}

// Watermark Settings
export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  position: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center';
  opacity: number; // 0.1 to 1.0
  fontStyle: 'serif' | 'sans' | 'mono';
}

// Pose Cheatsheet
export interface PoseGuideCard {
  id: string;
  title: string;
  category: 'romance' | 'walking' | 'intimate' | 'editorial' | 'detail';
  prompt: string;
  cueForCouple: string;
  cameraSettings: {
    lens: string;
    aperture: string;
    shutter: string;
    iso: string;
    lighting: string;
  };
}
