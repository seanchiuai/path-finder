const API_BASE_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8001';

export interface OnboardingData {
  userId: string;
  background: string;
  skills: string;
  interests: string;
  goals: string;
  values: string;
  personality?: string;
}

export interface CareerAnalysisRequest {
  userId: string;
  careerId: string;
  timeframe: '3_months' | '6_months' | '1_year';
}

export interface CareerRecommendation {
  career: string;
  match_score: number;
  reasoning: string;
  required_skills: string[];
  salary_range: string;
  growth_potential: string;
}

export interface AnalysisResult {
  success: boolean;
  userId: string;
  analysis: {
    skills_analysis: any;
    personality_analysis: any;
    passions_analysis: any;
    goals_analysis: any;
    values_analysis: any;
    recommendations: CareerRecommendation[];
  };
  recommendations: CareerRecommendation[];
  timestamp: number;
}

export interface ActionPlanResponse {
  success: boolean;
  userId: string;
  careerId: string;
  timeframe: string;
  actionPlan: {
    phases: Array<{
      title: string;
      duration: string;
      steps: string[];
      resources: string[];
    }>;
    total_duration: string;
    estimated_effort: string;
  };
  timestamp: number;
}

export interface CareerInsights {
  career_id: string;
  title: string;
  description: string;
  required_skills: string[];
  average_salary: string;
  job_growth: string;
  education_requirements: string;
  work_environment: string;
  typical_day: string[];
  career_path: string[];
}

export interface OnboardingStartResponse {
  success: boolean;
  orchestratorSessionId: string;
  careerProfile: any;
  recommendedRoles: CareerRecommendation[];
}

export interface NextLLMResponse {
  success: boolean;
  next: string;
}

class CareerAPI {
  private async fetchWithErrorHandling(url: string, options?: RequestInit) {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  async analyzeOnboarding(data: OnboardingData): Promise<AnalysisResult> {
    return this.fetchWithErrorHandling('/api/analyze-onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateActionPlan(request: CareerAnalysisRequest): Promise<ActionPlanResponse> {
    return this.fetchWithErrorHandling('/api/generate-action-plan', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getCareerInsights(careerId: string): Promise<{ success: boolean; insights: CareerInsights }> {
    return this.fetchWithErrorHandling(`/api/career-insights/${careerId}`);
  }

  async testAgents(): Promise<{ success: boolean; test_result: any }> {
    return this.fetchWithErrorHandling('/api/test-agents', {
      method: 'POST',
    });
  }

  async transcribeAudio(audioBase64: string): Promise<{ success: boolean; text: string; language?: string; confidence?: number }>{
    return this.fetchWithErrorHandling('/api/voice/stt', {
      method: 'POST',
      body: JSON.stringify({ audio_data: audioBase64, language: 'en' }),
    });
  }

  async onboardingStart(transcript: string, resume_text?: string): Promise<OnboardingStartResponse> {
    return this.fetchWithErrorHandling('/api/onboarding/start', {
      method: 'POST',
      body: JSON.stringify({ transcript, resume_text }),
    });
  }

  async onboardingLLMResponse(history: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<NextLLMResponse> {
    return this.fetchWithErrorHandling('/api/onboarding/llm-response', {
      method: 'POST',
      body: JSON.stringify({ history }),
    });
  }

  async getCareerDetails(role: string, industry?: string): Promise<{ success: boolean; role: string; industry: string; salaryDataPoints: any[]; resources: any[] }>{
    const params = new URLSearchParams({ role, ...(industry ? { industry } : {}) });
    return this.fetchWithErrorHandling(`/api/data/career-details?${params.toString()}`);
  }
}

export const careerAPI = new CareerAPI();
