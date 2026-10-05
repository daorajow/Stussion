import { AestheticPreset, LightingOption, CameraOption, LocationOption } from '../types';

export interface PresetSubject {
  id: string;
  name: string;
  subtitle: string;
  avatar: string;
  photos: {
    name: string;
    url: string;
  }[];
}

export const PRESET_SUBJECTS: PresetSubject[] = [
  {
    id: 'valentina',
    name: 'Valentina Moreau',
    subtitle: 'Haute Couture • Rasgos Esculpidos',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    photos: [
      {
        name: 'Valentina - Close Up Rostro Frontal',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
      },
      {
        name: 'Valentina - Ángulo Perfil y Mirada',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop',
      },
      {
        name: 'Valentina - Luz de Estudio Suave',
        url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop',
      },
    ],
  },
  {
    id: 'mateo',
    name: 'Mateo Sterling',
    subtitle: 'Vogue Man • Estilo Minimalista',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop',
    photos: [
      {
        name: 'Mateo - Retrato Frontal Editorial',
        url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop',
      },
      {
        name: 'Mateo - Mirada Lateral 45°',
        url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop',
      },
      {
        name: 'Mateo - Expresión Serena en Estudio',
        url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600&auto=format&fit=crop',
      },
    ],
  },
  {
    id: 'sora',
    name: 'Sora Tanaka',
    subtitle: 'Harper\'s Bazaar • Vanguardia y Moda',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=300&auto=format&fit=crop',
    photos: [
      {
        name: 'Sora - Belleza Close-Up',
        url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop',
      },
      {
        name: 'Sora - Luz Editorial Natural',
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop',
      },
    ],
  },
];

export const AESTHETIC_PRESETS: AestheticPreset[] = [
  {
    id: 'quiet-luxury',
    label: 'Quiet Luxury',
    category: 'Elegancia Sobria',
    description: 'Tonos beige, lino, cachemira y minimalismo al estilo Loro Piana.',
    promptSnippet: 'Quiet luxury fashion aesthetic, understated high wealth elegance, neutral cashmere and fine silk fabrics, impeccably tailored minimalism, soft refined ambiance',
    accentColor: '#9c826b',
  },
  {
    id: 'haute-couture',
    label: 'Haute Couture',
    category: 'Alta Costura',
    description: 'Siluetas arquitectónicas, telas suntuosas y dramatismo estilo Met Gala.',
    promptSnippet: 'High-end Paris Haute Couture fashion editorial, dramatic avant-garde designer silhouette, opulent heavy fabrics, sculpted architectural garments, runway masterwork',
    accentColor: '#c25e38',
  },
  {
    id: 'minimal-90s',
    label: 'Vogue 90s Minimal',
    category: 'Clásico Vintage',
    description: 'Inspirado en Helmut Newton y Peter Lindbergh: trajes masculinos y sobriedad.',
    promptSnippet: '1990s vintage Vogue editorial aesthetic, raw authenticity, Helmut Newton inspired, structured oversized black tailoring, clean sharp silhouettes',
    accentColor: '#44403c',
  },
  {
    id: 'cyber-street',
    label: 'Cyber-Balenciaga',
    category: 'Vanguardia Urbana',
    description: 'Cuero negro charol, vinilo, cortes futuristas y actitud desafiante.',
    promptSnippet: 'Balenciaga futuristic luxury streetwear aesthetic, glossy patent leather, oversized structured silhouettes, avant-garde dark luxury, dystopian edge',
    accentColor: '#09090b',
  },
  {
    id: 'mediterranean',
    label: 'Mediterráneo Jacquemus',
    category: 'Luz Natural',
    description: 'Lino tostado, sol dorado, brisa y elegancia estival relajada.',
    promptSnippet: 'Jacquemus inspired Mediterranean high fashion editorial, raw linen textures, warm golden sunlight, effortless summer elegance, sculptural straw and drape accents',
    accentColor: '#d97706',
  },
  {
    id: 'cinema-noir',
    label: 'Cinema Noir Monocromo',
    category: 'Blanco y Negro',
    description: 'Sombras profundas de claroscuro, gabardinas clásicas y aire de misterio.',
    promptSnippet: 'Cinematic film noir high contrast monochrome editorial, heavy moody shadows, classic trench coat, evocative cinematic atmosphere, sharp dramatic lighting',
    accentColor: '#262626',
  },
];

export const LIGHTING_OPTIONS: LightingOption[] = [
  {
    id: 'rembrandt',
    label: 'Rembrandt de Estudio',
    icon: 'flare',
    description: 'Triángulo de luz suave en la mejilla; profundidad y volumen tridimensional.',
    promptSnippet: 'Master Rembrandt studio strobe lighting, subtle triangular key light on cheek, rich soft-shadow roll-off, sculpted facial contours',
  },
  {
    id: 'butterfly',
    label: 'Paramount / Beauty',
    icon: 'wb_sunny',
    description: 'Luz cenital frontal que realza pómulos y mirada limpia; ideal para cosmética.',
    promptSnippet: 'Paramount Butterfly beauty lighting, high overhead softbox with subtle lower reflector, glowing cheekbones, sparkling catchlights in eyes',
  },
  {
    id: 'rim-golden',
    label: 'Contraluz / Golden Rim',
    icon: 'wb_twilight',
    description: 'Halo dorado de silueta que separa al sujeto del fondo con destello en el cabello.',
    promptSnippet: 'Dramatic golden rim backlighting, luminous edge halo accentuating hair and shoulder silhouette, warm cinematic flare, soft fill',
  },
  {
    id: 'split-dramatic',
    label: 'Split Lighting',
    icon: 'contrast',
    description: 'Iluminación lateral que divide el rostro; misterio y contraste extremo.',
    promptSnippet: 'Sharp split lighting directly from the side, half of face in luminous detail, half in deep sculptural shadow, high fashion intensity',
  },
  {
    id: 'neon-cinema',
    label: 'Neón Cine Bicolor',
    icon: 'palette',
    description: 'Luces cruzadas en tonos azul cian y ámbar cálido para sesiones nocturnas.',
    promptSnippet: 'Subtle cinematic dual-tone studio lighting, soft cyan key with warm amber rim light, modern atmospheric magazine illumination',
  },
  {
    id: 'gobo-shadows',
    label: 'Sombras Gobo Artísticas',
    icon: 'filter_b_and_w',
    description: 'Patrones geométricos y sombras de persiana o arquitectura proyectadas sobre el sujeto.',
    promptSnippet: 'Artistic architectural gobo shadows projected across face and clothing, soft Venetian blind shadow lines, high fashion play of light and dark',
  },
];

export const CAMERA_OPTIONS: CameraOption[] = [
  {
    id: 'hasselblad',
    label: 'Hasselblad 100MP Digital',
    description: 'Nitidez cristalina, rango dinámico masivo y texturas de piel intactas.',
    promptSnippet: 'Photographed on medium-format Hasselblad H6D-100c, 85mm f/1.4 portrait lens, pristine hyper-detailed skin pores and fabric texture, zero blur',
  },
  {
    id: 'kodak-portra',
    label: 'Kodak Portra 400 (35mm)',
    description: 'Tonos de piel cálidos y aterciopelados con grano analógico sutil y elegante.',
    promptSnippet: 'Shot on 35mm film Kodak Portra 400, warm creamy skin tones, subtle organic film grain, natural gentle highlights, analog fashion magazine quality',
  },
  {
    id: 'leica-monochrome',
    label: 'Leica M11 Monochrom',
    description: 'Blanco y negro puro de escala de grises perfecta y microcontraste soberbio.',
    promptSnippet: 'Shot on Leica M Monochrom with 50mm Noctilux lens f/1.2, pure black and white, deep velvety blacks, luminous silvery midtones, pristine clarity',
  },
];

export const LOCATION_OPTIONS: LocationOption[] = [
  {
    id: 'cyclorama',
    label: 'Ciclorama de Estudio Minimal',
    description: 'Fondo infinito neutro (gris cálido o marfil) sin distracciones.',
    promptSnippet: 'In an expansive minimalist studio with smooth seamless ivory-gray cyclorama backdrop, neutral modern aesthetic',
  },
  {
    id: 'paris-rooftop',
    label: 'Azotea en París al Atardecer',
    description: 'Hora azul sobre la arquitectura haussmanniana y cielo crepuscular.',
    promptSnippet: 'On an elegant Parisian rooftop overlooking limestone Haussmannian facades at twilight blue hour, distant soft romantic city lights',
  },
  {
    id: 'brutalist-museum',
    label: 'Arquitectura Brutalista',
    description: 'Hormigón pulido, tragaluces monumentales y líneas geométricas sobrias.',
    promptSnippet: 'Inside a contemporary brutalist art pavilion, monumental polished raw concrete walls, soaring minimalist glass skylight',
  },
  {
    id: 'palazzo-marble',
    label: 'Palazzo de Mármol Italiano',
    description: 'Suelos de terrazo veneciano, molduras desvaídas y luz de ventanal antiguo.',
    promptSnippet: 'Inside a historic Milanese palazzo, antique Venetian marble floors, faint baroque plaster moldings, tall arched window daylight',
  },
];

export const CREATIVE_TAGS = [
  'Vestido de seda rojo carmín en azotea de Milán al atardecer',
  'Traje sastre oversize de lino crudo, iluminación suave estilo Helmut Newton',
  'Estética Cyberpunk elegante con reflejos de lluvia y trench negro de charol',
  'Luz natural de atardecer dorado en villa mediterránea con joyas doradas',
  'Editorial de joyería de alta gama en fondo negro mate aterciopelado',
  'Look urbano deportivo futurista con gabardina de cuero brillante y tacones',
];
