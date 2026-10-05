import { RawPresetOption, SkyOption } from '../types';

export const RAW_PRESETS: RawPresetOption[] = [
  {
    id: 'golden-hour-romance',
    name: 'Golden Hour Romance',
    category: 'prewedding',
    description: 'Tonos miel y ámbar, halo dorado en el cabello, piel cálida y aterciopelada al estilo atardecer romántico.',
    colorGradePrompt: 'High-end fine art pre-wedding photography color grade. Warm golden hour lighting, radiant backlit rim glow on hair, creamy warm skin tones, soft pastel highlights, dreamy romantic atmosphere, Kodak Portra warmth, perfectly preserved facial details.',
    tags: ['Pre-boda', 'Atardecer', 'Romance'],
    badgeColor: '#d97706',
  },
  {
    id: 'moody-boho',
    name: 'Moody Boho & Earthy',
    category: 'prewedding',
    description: 'Verdes oliva desaturados, tonos tierra ricos, contraste suave y atmósfera cinematográfica de boda campestre.',
    colorGradePrompt: 'Moody earthy bohemian wedding color grading. Muted olive forest greens, rich terracotta warm earth tones, gentle matte shadow curve, cinematic emotional depth, elegant natural contrast, intimate documentary wedding aesthetic.',
    tags: ['Boho', 'Bosque', 'Tonos Tierra'],
    badgeColor: '#78716c',
  },
  {
    id: 'fine-art-luminous',
    name: 'Fine Art Luminous',
    category: 'editorial',
    description: 'Blancos puros y luminosos, encaje y texturas cristalinas, piel de porcelana y luz difusa de lujo.',
    colorGradePrompt: 'Fine art bright & airy luxury bridal photography color grade. Luminous soft diffused daylight, pristine clean whites with rich lace fabric texture, radiant porcelain skin tones, gentle highlights, editorial wedding magazine cover quality.',
    tags: ['Fine Art', 'Luz Limpia', 'Alta Gama'],
    badgeColor: '#0284c7',
  },
  {
    id: 'kodak-portra-wedding',
    name: 'Kodak Portra 400 Film',
    category: 'film',
    description: 'Estética de película analógica clásica de 35mm con grano fino orgánico y colores pastel atemporales.',
    colorGradePrompt: 'Authentic 35mm analog film aesthetic shot on Kodak Portra 400. Delicate fine film grain, natural gentle highlight rolloff, pastel color harmony, flattering true-to-life skin tones, timeless vintage editorial feel.',
    tags: ['Analógico 35mm', 'Pastel', 'Atemporal'],
    badgeColor: '#b45309',
  },
  {
    id: 'sunset-cinematic-flare',
    name: 'Cinematic Sunset Flare',
    category: 'prewedding',
    description: 'Destello de lente anamórfico sutil, atmósfera crepuscular y resplandor etéreo sobre la pareja.',
    colorGradePrompt: 'Cinematic pre-wedding film still color grading with subtle optical lens flare. Warm twilight glow, cinematic 2.39:1 color palette, gentle contrast, golden atmosphere enveloping the couple, emotional movie still appearance.',
    tags: ['Destello Óptico', 'Cine', 'Crepúsculo'],
    badgeColor: '#ea580c',
  },
  {
    id: 'timeless-noir-bw',
    name: 'Timeless Monocromo B&W',
    category: 'bw',
    description: 'Escala de grises rica al estilo Leica, foco en miradas, texturas de ropa y emoción profunda.',
    colorGradePrompt: 'Masterful fine art black and white wedding portrait. Rich deep blacks, silvery luminous midtones, emotional high dynamic range, classic Leica M monochrome look, highlighting raw emotion and intimacy.',
    tags: ['Monocromo', 'Emotivo', 'Clásico'],
    badgeColor: '#1c1917',
  },
];

export const SKY_OPTIONS: SkyOption[] = [
  {
    id: 'none',
    label: 'Cielo Original',
    description: 'Conserva el cielo y la luz original de la escena sin reemplazar el fondo.',
    promptSnippet: '',
    icon: 'block',
  },
  {
    id: 'golden-sunset',
    label: 'Atardecer Dorado Cálido',
    description: 'Sustituye cielos blancos o apagados por nubes doradas encendidas y resplandor crepuscular.',
    promptSnippet: 'Sky and Atmosphere Doctor: Replace any flat, washed out, or overexposed sky with a breathtaking warm golden hour sunset with rich illuminated amber and peach clouds, casting soft warm light over the entire landscape.',
    icon: 'wb_twilight',
  },
  {
    id: 'blue-hour',
    label: 'Hora Azul Crepuscular',
    description: 'Cielo azul zafiro con tonos violetas suaves; misticismo y romance nocturno.',
    promptSnippet: 'Sky and Atmosphere Doctor: Replace the sky with a cinematic blue hour twilight sky, deep indigo and soft magenta gradient at horizon, giving an ethereal evening mood with harmonious cool ambient fill.',
    icon: 'nights_stay',
  },
  {
    id: 'soft-daylight',
    label: 'Cielo Azul y Nubes de Algodón',
    description: 'Cielo diáfano y limpio con nubes esponjosas desenfocadas naturalmente.',
    promptSnippet: 'Sky and Atmosphere Doctor: Replace dull overcast sky with a crisp soft cerulean blue sky with gentle painterly white cumulus clouds, balanced natural daylight.',
    icon: 'wb_sunny',
  },
  {
    id: 'misty-drama',
    label: 'Bruma & Niebla Romántica',
    description: 'Velo de niebla suave entre colinas o árboles que aporta profundidad pictórica.',
    promptSnippet: 'Sky and Atmosphere Doctor: Introduce dreamy atmospheric mountain mist and subtle rolling fog in the distant background, adding magical fine art painterly depth.',
    icon: 'cloud',
  },
];

export interface SampleRawPhoto {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  recommendedPreset: string;
  recommendedSky?: string;
}

export const SAMPLE_RAW_PHOTOS: SampleRawPhoto[] = [
  {
    id: 'couple-beach',
    title: 'Pareja en la Costa',
    subtitle: 'Toma cruda con luz plana de tarde nublada',
    url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop',
    recommendedPreset: 'golden-hour-romance',
    recommendedSky: 'golden-sunset',
  },
  {
    id: 'couple-forest',
    title: 'Pre-Boda en el Bosque',
    subtitle: 'Toma natural en exterior con sombras duras',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop',
    recommendedPreset: 'moody-boho',
    recommendedSky: 'misty-drama',
  },
  {
    id: 'bride-portrait',
    title: 'Retrato de Novia',
    subtitle: 'Luz natural de ventana antes de la ceremonia',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
    recommendedPreset: 'fine-art-luminous',
    recommendedSky: 'soft-daylight',
  },
];
