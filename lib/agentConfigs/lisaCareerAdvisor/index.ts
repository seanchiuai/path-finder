import { RealtimeAgent } from '@openai/agents/realtime';
import { lisaAgentInstructions } from './prompts';

export const lisaAgent = new RealtimeAgent({
  name: 'lisa',
  voice: 'sage',
  instructions: lisaAgentInstructions,
  tools: [],
});

export const lisaCareerAdvisorScenario = [lisaAgent];

export default lisaCareerAdvisorScenario;
