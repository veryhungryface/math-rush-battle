export type Skill = {
  id: string;
  name: string;
  description: string;
  summary: string;
  instructions: string;
  category: string;
  triggerPhrases: string[];
  famous: boolean;
  enabled: boolean;
  examples: string[];
  resources: SkillResources;
  sourcePath: string;
};

export type SkillResources = {
  scripts: string[];
  references: string[];
  assets: string[];
};

export type ExecuteResponse = {
  instruction: string;
  selectedSkill: string;
  selectedReason: string;
  args: Record<string, unknown>;
  output: string;
  steps: string[];
  at: string;
};

export type ProviderMode = 'auto' | 'oauth' | 'apiKey';
export type ReasoningEffort =
  | 'default'
  | 'none'
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh';
export type TextVerbosity = 'low' | 'medium' | 'high';

export type OAuthStatus = {
  configured: boolean;
  proxyReady: boolean;
  status?: number;
  error?: string;
  url: string;
  credentials: Array<{
    path: string;
    exists: boolean;
  }>;
  checkedAt: string;
};

export type MathConvertResponse = {
  plain_text: string;
  problem_markdown: string;
  formulas: Array<{
    raw: string;
    latex: string;
    role: string;
  }>;
  image_regions: Array<{
    kind: string;
    description: string;
    confidence: number;
  }>;
  diagram: {
    detected: boolean;
    summary: string;
    confidence: number;
    geogebra_commands: string[];
    warnings: string[];
  };
  provider: 'oauth' | 'apiKey';
  model: string;
  reasoning_effort: ReasoningEffort;
  text_verbosity: TextVerbosity;
  geogebra_file: {
    filename: string;
    mimeType: string;
    base64: string;
    bytes: number;
    commands: string[];
  };
  converted_at: string;
};
