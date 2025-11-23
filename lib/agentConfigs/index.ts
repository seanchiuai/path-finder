import { lisaCareerAdvisorScenario } from './lisaCareerAdvisor';

import type { RealtimeAgent } from '@openai/agents/realtime';

// Map of scenario key -> array of RealtimeAgent objects
export const allAgentSets: Record<string, RealtimeAgent[]> = {
  lisaCareerAdvisor: lisaCareerAdvisorScenario,
};

export const defaultAgentSetKey = 'lisaCareerAdvisor';
