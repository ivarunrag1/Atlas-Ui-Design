/* The three AI teammates. Portraits are 512×512 3D renders (Figma AI, "Agent Avatars"
   page, Style = 3D); WebP with a PNG fallback. States are drawn in code, not exported. */
import rheaWebp from '@/assets/agents/rhea.webp';
import rheaPng from '@/assets/agents/rhea.png';
import maxWebp from '@/assets/agents/max.webp';
import maxPng from '@/assets/agents/max.png';
import mayaWebp from '@/assets/agents/maya.webp';
import mayaPng from '@/assets/agents/maya.png';

export type AgentId = 'rhea' | 'max' | 'maya';

export interface AgentProfile {
  id: AgentId;
  name: string;
  role: string;
  /** Accent token (dashboard agent colour). */
  accent: string;
  portrait: { webp: string; png: string };
}

export const agents: Record<AgentId, AgentProfile> = {
  rhea: { id: 'rhea', name: 'Rhea', role: 'SDR agent · finds and qualifies leads', accent: 'var(--color-stage-blue)', portrait: { webp: rheaWebp, png: rheaPng } },
  max: { id: 'max', name: 'Max', role: 'Sales & quote agent · quotes and follows up', accent: 'var(--color-stage-violet)', portrait: { webp: maxWebp, png: maxPng } },
  maya: { id: 'maya', name: 'Maya', role: 'CRM agent · keeps records current, raises risks', accent: 'var(--color-stage-green)', portrait: { webp: mayaWebp, png: mayaPng } },
};
