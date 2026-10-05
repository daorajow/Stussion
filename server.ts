import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Shared Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// POST /api/enhance-prompt: Expands a user idea into high-fashion editorial art direction
app.post('/api/enhance-prompt', async (req, res) => {
  try {
    const { rawDescription, aesthetic } = req.body;

    if (!rawDescription || typeof rawDescription !== 'string') {
      return res.status(400).json({ error: 'Se requiere una descripción de entrada' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'API Key de Gemini no disponible' });
    }

    const systemPrompt = `You are a world-renowned creative director and head of styling for Vogue Italia, Harper's Bazaar, and high-fashion ateliers in Paris and Milan.
Your task is to take a rough user idea for a fashion photo shoot and expand it into a concise, evocative, and hyper-detailed visual art direction prompt (2 to 3 sentences maximum).
Include:
1. Precise garment styling, tailoring, and luxury fabric textures (e.g., heavy mulberry silk, structured cashmere wool, liquid patent leather).
2. Mood, color palette, and atmospheric ambiance.
3. Cinematic and editorial lighting details.
Do NOT include camera gear or resolution buzzwords like '8k'—focus purely on visual styling and art direction. Write the final response in clear, poetic Spanish.`;

    const userContent = `Idea inicial: "${rawDescription}".
${aesthetic ? `Estética deseada: "${aesthetic}".` : ''}
Genera la dirección de arte expandida:`;

    let enhanced = '';
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    
    for (const m of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: m,
          contents: userContent,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });
        enhanced = response.text?.trim() || '';
        if (enhanced) break;
      } catch (err: any) {
        console.warn(`Model ${m} failed for enhance-prompt, trying next:`, err?.message);
      }
    }

    if (!enhanced) {
      enhanced = `Vestido de alta costura con telas nobles, iluminación escultórica de estudio con sombras suaves y estética editorial de revista internacional. ${rawDescription}`;
    }

    return res.json({ enhanced });
  } catch (err: any) {
    console.error('Error enhancing prompt:', err);
    return res.status(500).json({ error: 'No se pudo mejorar el prompt automáticamente.' });
  }
});

// POST /api/generate-pose: Generates an editorial photo shot with multi-layer direction
app.post('/api/generate-pose', async (req, res) => {
  try {
    const {
      prompt,
      customDescription,
      selectedAestheticPrompt,
      selectedLightingPrompt,
      selectedCameraPrompt,
      selectedLocationPrompt,
      shotOverride,
      referenceImages,
      poseId,
      poseLabel,
      aspectRatio = '4:5',
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt es requerido' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'La clave GEMINI_API_KEY no está configurada en las variables de entorno.',
      });
    }

    // Build multimodal contents
    const parts: any[] = [];

    // Reference images
    if (Array.isArray(referenceImages) && referenceImages.length > 0) {
      for (const ref of referenceImages.slice(0, 4)) {
        if (ref?.base64) {
          const cleanBase64 = ref.base64.replace(/^data:[^;]+;base64,/, '');
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: ref.mimeType || 'image/jpeg',
            },
          });
        }
      }
    }

    // Assemble comprehensive master editorial prompt
    const baseShot = shotOverride?.trim() ? shotOverride.trim() : prompt;
    const aestheticText = selectedAestheticPrompt || 'Haute couture luxury magazine editorial styling';
    const lightingText = selectedLightingPrompt || 'Professional master studio lighting with subtle rim light';
    const cameraText = selectedCameraPrompt || 'Photographed on medium-format Hasselblad 100MP, 85mm f/1.8 lens, pristine skin texture';
    const locationText = selectedLocationPrompt || 'In an elegant minimalist fashion studio environment';
    const userStyling = customDescription?.trim()
      ? `Art Direction & Wardrobe: ${customDescription.trim()}.`
      : 'Wardrobe: Flawless high-fashion tailored designer pieces with refined luxury textures.';

    const identityRule =
      parts.length > 0
        ? 'CRITICAL IDENTITY RULE: The subject in the output photograph MUST faithfully maintain the exact facial bone structure, eye shape, nose contour, lip form, skin undertone, and recognizable facial identity of the person shown in the reference image(s). Ensure absolute identity continuity across all shots.'
        : 'Subject: Striking high-fashion editorial model with sculpted facial features, confident poise, and natural beauty.';

    const negativeGuardrails =
      'Strict quality constraints: Natural pores and real skin texture. Zero artificial plastic smoothing, zero waxy beauty filters, zero warped or missing fingers, zero messy background artifacts. Authentic high-end cover-worthy publication photograph.';

    const fullPrompt = `EDITORIAL FASHION MAGAZINE PHOTOGRAPH:
[Shot Composition]: ${baseShot}.
[Aesthetic & Mood]: ${aestheticText}.
[Lighting]: ${lightingText}.
[Location / Set]: ${locationText}.
[Optical System]: ${cameraText}.
[Styling & Details]: ${userStyling}
[Identity Consistency]: ${identityRule}
[Quality Assurance]: ${negativeGuardrails}`;

    parts.push({ text: fullPrompt });

    // Map aspect ratio for Gemini: '4:5' -> '3:4', '1:1', '9:16', '16:9'
    let geminiRatio = '3:4';
    if (aspectRatio === '1:1') geminiRatio = '1:1';
    else if (aspectRatio === '9:16') geminiRatio = '9:16';
    else if (aspectRatio === '16:9') geminiRatio = '16:9';
    else geminiRatio = '3:4'; // Closest to 4:5

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: geminiRatio,
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn('Primary model issue, attempting fallback to gemini-3.1-flash-image:', primaryErr?.message);
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: geminiRatio,
            },
          },
        });
      } catch (secErr: any) {
        console.warn('Secondary fallback to gemini-3.1-flash-lite-image:', secErr?.message);
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: { parts },
        });
      }
    }

    let generatedBase64: string | null = null;
    let generatedMimeType = 'image/png';

    const candidate = response?.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          generatedBase64 = part.inlineData.data;
          generatedMimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!generatedBase64) {
      const textOutput = response?.text || 'No image data returned from model.';
      console.error('Model returned text without image:', textOutput);
      return res.status(502).json({
        error: `El modelo no generó una imagen: ${textOutput.substring(0, 160)}`,
      });
    }

    return res.json({
      mediaId: `shot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      base64: generatedBase64,
      mimeType: generatedMimeType,
      type: 'image',
      name: `Studio Session - ${poseLabel || poseId}`,
      poseId,
      poseLabel,
      promptUsed: baseShot,
      aspectRatio,
    });
  } catch (error: any) {
    console.error('Error generating photo in /api/generate-pose:', error);
    return res.status(500).json({
      error: error?.message || 'Error al procesar la sesión de fotos con Gemini AI.',
    });
  }
});

// POST /api/grade-raw-photo: Professional color grading, relighting and polishing for real raw photos
app.post('/api/grade-raw-photo', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      presetName,
      colorGradePrompt,
      selectedSkyPrompt,
      customInstructions,
      cleanBackground,
      enhanceLighting,
      skinToneRetouch,
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Se requiere una imagen para procesar' });
    }

    if (!ai) {
      return res.status(500).json({
        error: 'La clave GEMINI_API_KEY no está configurada en las variables de entorno.',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const parts: any[] = [
      {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      },
    ];

    const backgroundDirective = cleanBackground
      ? 'Background Enhancement: Subtly clean up any unsightly background clutter or distractions while preserving the natural environment. Enhance scenic depth of field and soft background separation.'
      : '';

    const lightingDirective = enhanceLighting
      ? 'Atmospheric Relighting: Add professional directional lighting enhancement, soft golden hour rim-lighting around hair and shoulders, and natural three-dimensional fill light.'
      : '';

    const skinDirective = skinToneRetouch
      ? 'Skin Tone Grading: Optimize skin tone harmony and soften harsh shadows while preserving 100% authentic skin pores, fine texture, and zero waxy artificial blur.'
      : '';

    const customNote = customInstructions?.trim()
      ? `Photographer Custom Note: ${customInstructions.trim()}.`
      : '';

    const skyDirective = selectedSkyPrompt?.trim()
      ? `Sky & Lighting Replacement: ${selectedSkyPrompt.trim()}`
      : '';

    const masterGradePrompt = `PROFESSIONAL PHOTOGRAPHY COLOR GRADING, RELIGHTING & EDITORIAL FINISHING:
Task: Perform expert high-end color grading and retouching on this real photograph (e.g. pre-wedding, couple session, or portrait).
CRITICAL IDENTITY & POSE RULE: You must keep the exact same people, faces, facial expressions, body pose, garments, hairstyles, and subject identity completely identical to the input photograph. Do not invent new faces or alter their real appearance.
Selected Look: ${presetName || 'Fine Art Wedding'}.
Color Grading Directive: ${colorGradePrompt || 'Warm golden hour cinematic color grading, balanced tonal curves, and rich dynamic range.'}
${skyDirective}
${backgroundDirective}
${lightingDirective}
${skinDirective}
${customNote}
Output Standard: High-end wedding album fine-art print quality, professional film curve, rich organic shadows, luminous highlights, authentic camera capture aesthetic.`;

    parts.push({ text: masterGradePrompt });

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
      });
    } catch (primaryErr: any) {
      console.warn('Primary model issue for raw grading, falling back to gemini-3.1-flash-image:', primaryErr?.message);
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: { parts },
        });
      } catch (secErr: any) {
        console.warn('Secondary fallback to gemini-3.1-flash-lite-image:', secErr?.message);
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: { parts },
        });
      }
    }

    let gradedBase64: string | null = null;
    let gradedMimeType = 'image/png';

    const candidate = response?.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          gradedBase64 = part.inlineData.data;
          gradedMimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!gradedBase64) {
      const textOutput = response?.text || 'No image data returned from model.';
      console.error('Model returned text for raw grading:', textOutput);
      return res.status(502).json({
        error: `El modelo no generó la fotografía revelada: ${textOutput.substring(0, 160)}`,
      });
    }

    return res.json({
      id: `graded-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      gradedBase64,
      mimeType: gradedMimeType,
      presetName,
    });
  } catch (error: any) {
    console.error('Error grading raw photo in /api/grade-raw-photo:', error);
    return res.status(500).json({
      error: error?.message || 'Error al procesar el revelado de la fotografía con Gemini.',
    });
  }
});

// POST /api/create-image: Creates new image using text prompt with gemini-3.1-flash-image-preview
app.post('/api/create-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Se requiere un prompt descriptivo' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'API Key de Gemini no disponible' });
    }

    // Map aspect ratio for Gemini: '1:1', '3:4', '4:3', '9:16', '16:9'
    let geminiRatio = '1:1';
    if (aspectRatio === '4:5' || aspectRatio === '3:4') geminiRatio = '3:4';
    else if (aspectRatio === '9:16') geminiRatio = '9:16';
    else if (aspectRatio === '16:9') geminiRatio = '16:9';
    else if (aspectRatio === '4:3') geminiRatio = '4:3';
    else geminiRatio = '1:1';

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: prompt.trim() }],
        },
        config: {
          imageConfig: {
            aspectRatio: geminiRatio,
          },
        },
      });
    } catch (err: any) {
      console.warn('Fallback in create-image:', err?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: prompt.trim() }],
        },
        config: {
          imageConfig: {
            aspectRatio: geminiRatio,
          },
        },
      });
    }

    let generatedBase64: string | null = null;
    let generatedMimeType = 'image/png';

    const candidate = response?.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          generatedBase64 = part.inlineData.data;
          generatedMimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!generatedBase64) {
      return res.status(502).json({
        error: response?.text || 'No se pudo generar la imagen a partir del texto.',
      });
    }

    return res.json({
      id: `ai-img-${Date.now()}`,
      base64: generatedBase64,
      mimeType: generatedMimeType,
      prompt,
      aspectRatio,
    });
  } catch (error: any) {
    console.error('Error in /api/create-image:', error);
    return res.status(500).json({
      error: error?.message || 'Error al generar imagen con gemini-3.1-flash-image-preview.',
    });
  }
});

// POST /api/edit-image: Edits existing image using text prompt with gemini-3.1-flash-image-preview
app.post('/api/edit-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', editPrompt } = req.body;

    if (!imageBase64 || !editPrompt) {
      return res.status(400).json({ error: 'Se requiere la imagen base64 y el prompt de edición' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'API Key de Gemini no disponible' });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const parts: any[] = [
      {
        inlineData: {
          data: cleanBase64,
          mimeType,
        },
      },
      {
        text: `IMAGE EDITING INSTRUCTION:
Carefully modify this input image according to the following directive: "${editPrompt.trim()}".
Maintain the overall composition, lighting consistency, subject anatomy, and photorealistic fidelity unless explicitly asked to change them.
Produce a natural, seamless, professional high-resolution output.`,
      },
    ];

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
      });
    } catch (err: any) {
      console.warn('Fallback in edit-image:', err?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: { parts },
      });
    }

    let editedBase64: string | null = null;
    let editedMimeType = 'image/png';

    const candidate = response?.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          editedBase64 = part.inlineData.data;
          editedMimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!editedBase64) {
      return res.status(502).json({
        error: response?.text || 'No se pudo editar la imagen.',
      });
    }

    return res.json({
      id: `ai-edit-${Date.now()}`,
      base64: editedBase64,
      mimeType: editedMimeType,
      editPrompt,
    });
  } catch (error: any) {
    console.error('Error in /api/edit-image:', error);
    return res.status(500).json({
      error: error?.message || 'Error al editar imagen con gemini-3.1-flash-image-preview.',
    });
  }
});

// POST /api/inpaint-image: Localized Inpainting & Object Removal / Area modification with mask overlay
app.post('/api/inpaint-image', async (req, res) => {
  try {
    const { imageBase64, maskOverlayBase64, instruction, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Se requiere la imagen base' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'API Key de Gemini no disponible' });
    }

    const cleanImageBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const cleanMaskBase64 = maskOverlayBase64 ? maskOverlayBase64.replace(/^data:[^;]+;base64,/, '') : null;

    const userDirective = instruction && instruction.trim()
      ? instruction.trim()
      : 'Remove the marked object completely and reconstruct the background seamlessly with matching lighting, depth of field, and natural texture.';

    const parts: any[] = [
      {
        inlineData: {
          data: cleanImageBase64,
          mimeType,
        },
      },
    ];

    if (cleanMaskBase64) {
      parts.push({
        inlineData: {
          data: cleanMaskBase64,
          mimeType: 'image/png',
        },
      });
      parts.push({
        text: `EXPERT LOCALIZED INPAINTING & OBJECT REMOVAL / RETOUCHING:
You are provided two images:
1. The original clean photograph.
2. The exact same photograph with the targeted area highlighted in red/translucent mask.

Directive for the marked area: "${userDirective}".
CRITICAL LOCALIZED RULES:
- ONLY modify what is inside or immediately around the highlighted region.
- Completely erase the targeted object (e.g. planter, potted plant, unwanted person, distraction, cable, or blemishes) if requested.
- Seamlessly blend and reconstruct the surrounding texture, wall, floor, vegetation, or bokeh with realistic lighting and optical depth of field.
- Keep ALL other parts of the photo, including faces, people, lighting, and composition 100% identical and pixel-sharp.`,
      });
    } else {
      parts.push({
        text: `EXPERT PHOTO RETOUCHING & OBJECT REMOVAL:
Modify the photograph according to: "${userDirective}". Seamlessly blend changes with realistic textures and lighting.`,
      });
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
      });
    } catch (err: any) {
      console.warn('Fallback in inpaint-image:', err?.message);
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: { parts },
      });
    }

    let editedBase64: string | null = null;
    let editedMimeType = 'image/png';

    const candidate = response?.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          editedBase64 = part.inlineData.data;
          editedMimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!editedBase64) {
      return res.status(502).json({
        error: response?.text || 'No se pudo aplicar el borrado/modificación de la zona.',
      });
    }

    return res.json({
      id: `inpaint-${Date.now()}`,
      base64: editedBase64,
      mimeType: editedMimeType,
      instruction: userDirective,
    });
  } catch (error: any) {
    console.error('Error in /api/inpaint-image:', error);
    return res.status(500).json({
      error: error?.message || 'Error al procesar la modificación de área con Gemini.',
    });
  }
});

// POST /api/batch-beauty-pass: Batch AI Retouch & High-End Beauty Pass
app.post('/api/batch-beauty-pass', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      presetName = 'Editorial Pro',
      presetAesthetic = 'quiet-luxury',
      skinSmoothing = 'natural',
      lightingCorrection = 'balanced-fill',
      colorGrading = 'Warm rich tones, filmic contrast curve',
      customNotes = '',
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Se requiere la imagen para el revelado en lote.' });
    }

    if (!ai) {
      return res.status(500).json({ error: 'API Key de Gemini no disponible' });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const skinInstructions = {
      natural: 'Authentic editorial skin retouching: gentle micro-blemish removal while strictly preserving natural pore structure, peach fuzz, and organic skin luminescence. ZERO plastic or porcelain blurring.',
      'soft-glam': 'Studio glamour beauty pass: balanced tone equalization, refined skin texture, soft diffused skin highlights with crisp facial features and clear eyes.',
      'high-fashion': 'High-fashion runway finish: luminous cheekbones, sculpted natural micro-contouring, immaculate editorial complexion with full high-frequency pore texture intact.',
    }[skinSmoothing as 'natural' | 'soft-glam' | 'high-fashion'] || 'Professional natural skin retouching with authentic pore texture.';

    const lightingInstructions = {
      'balanced-fill': 'Professional photographic lighting correction: recover shadow detail, control blown highlights, gentle fill-in light on faces and clothing.',
      'dramatic-cinematic': 'Cinematic lighting pass: sculpted directional key light, rich contrast curve, deep atmospheric shadows, editorial rim accents.',
      'golden-glow': 'Golden hour luminous correction: warm radiant sun-kissed fill, creamy highlight rolloff, ambient sunset ambiance.',
    }[lightingCorrection as 'balanced-fill' | 'dramatic-cinematic' | 'golden-glow'] || 'Balanced exposure and natural tonal curves.';

    const promptText = `HIGH-END EDITORIAL BATCH RETOUCH & BEAUTY PASS:
Apply a top-tier magazine retouching and color-grading pass to this photograph while preserving original facial geometry, subject identity, and organic sharpness.

[1. SKIN RETOUCHING / BEAUTY PASS]:
${skinInstructions}

[2. LIGHTING & EXPOSURE CORRECTION]:
${lightingInstructions}

[3. COLOR GRADING (SESSION AESTHETIC: "${presetName} - ${presetAesthetic}")]:
${colorGrading}
Harmonize the overall scene colors to match this editorial palette.

${customNotes ? `[ADDITIONAL ART DIRECTIVE]: ${customNotes}` : ''}

[IDENTITY & INTEGRITY RULES]:
- Maintain the exact facial bone structure, facial identity, eye gaze, and expression of the subject.
- Output MUST look like a pristine, Hasselblad 100MP cover photograph retouched by a master retoucher in Milan or Paris.`;

    const parts: any[] = [
      {
        inlineData: {
          data: cleanBase64,
          mimeType,
        },
      },
      { text: promptText },
    ];

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
      });
    } catch (primaryErr: any) {
      console.warn('Primary model issue for batch beauty pass, falling back to gemini-3.1-flash-image:', primaryErr?.message);
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: { parts },
        });
      } catch (secErr: any) {
        console.warn('Secondary fallback to gemini-3.1-flash-lite-image:', secErr?.message);
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: { parts },
        });
      }
    }

    let retouchedBase64: string | null = null;
    let retouchedMimeType = 'image/png';

    const candidate = response?.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          retouchedBase64 = part.inlineData.data;
          retouchedMimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!retouchedBase64) {
      const textOutput = response?.text || 'No image data returned from model.';
      return res.status(502).json({
        error: `El modelo no generó el retoque: ${textOutput.substring(0, 160)}`,
      });
    }

    return res.json({
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      retouchedBase64,
      mimeType: retouchedMimeType,
      presetName,
    });
  } catch (error: any) {
    console.error('Error in /api/batch-beauty-pass:', error);
    return res.status(500).json({
      error: error?.message || 'Error al procesar el lote con Gemini.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Studio Session AI server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
