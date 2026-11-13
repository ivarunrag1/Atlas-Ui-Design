/* The three AI teammates. Portraits are 512×512 renders from the Figma "Agent Avatars"
   page: `photo` (Style = Photo, photoreal fictional people — the default) and `3d`
   (Style = 3D). WebP with a PNG fallback. States are drawn in code, not exported. */
import rheaPhotoWebp from '@/assets/agents/rhea-photo.webp';
import rheaPhotoPng from '@/assets/agents/rhea-photo.png';
import maxPhotoWebp from '@/assets/agents/max-photo.webp';
import maxPhotoPng from '@/assets/agents/max-photo.png';
import mayaPhotoWebp from '@/assets/agents/maya-photo.webp';
import mayaPhotoPng from '@/assets/agents/maya-photo.png';
import rhea3dWebp from '@/assets/agents/rhea-3d.webp';
import rhea3dPng from '@/assets/agents/rhea-3d.png';
import max3dWebp from '@/assets/agents/max-3d.webp';
import max3dPng from '@/assets/agents/max-3d.png';
import maya3dWebp from '@/assets/agents/maya-3d.webp';
import maya3dPng from '@/assets/agents/maya-3d.png';

export type AgentId = 'rhea' | 'max' | 'maya';
export type AgentLook = 'photo' | '3d';

interface Portrait {
  webp: string;
  png: string;
}

export interface AgentProfile {
  id: AgentId;
  name: string;
  role: string;
  /** Accent token (dashboard agent colour). */
  accent: string;
  portraits: Record<AgentLook, Portrait>;
}

export const agents: Record<AgentId, AgentProfile> = {
  rhea: {
    id: 'rhea',
    name: 'Rhea',
    role: 'SDR agent · finds and qualifies leads',
    accent: 'var(--color-stage-blue)',
    portraits: { photo: { webp: rheaPhotoWebp, png: rheaPhotoPng }, '3d': { webp: rhea3dWebp, png: rhea3dPng } },
  },
  max: {
    id: 'max',
    name: 'Max',
    role: 'Sales & quote agent · quotes and follows up',
    accent: 'var(--color-stage-violet)',
    portraits: { photo: { webp: maxPhotoWebp, png: maxPhotoPng }, '3d': { webp: max3dWebp, png: max3dPng } },
  },
  maya: {
    id: 'maya',
    name: 'Maya',
    role: 'CRM agent · keeps records current, raises risks',
    accent: 'var(--color-stage-green)',
    portraits: { photo: { webp: mayaPhotoWebp, png: mayaPhotoPng }, '3d': { webp: maya3dWebp, png: maya3dPng } },
  },
};
