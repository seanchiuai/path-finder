import { RealtimeAgent } from '@openai/agents/realtime';
import { generateCareerRecommendations } from './tools';
import { lisaAgentInstructions } from './prompts';

export const lisaAgent = new RealtimeAgent({
  name: 'lisa',
  voice: 'sage',
  instructions: lisaAgentInstructions,
  tools: [generateCareerRecommendations],
});

export const lisaCareerAdvisorScenario = [lisaAgent];

export default lisaCareerAdvisorScenario;
