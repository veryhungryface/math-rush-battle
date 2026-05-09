import type {
  ExecuteResponse,
  MathConvertResponse,
  OAuthStatus,
  ProviderMode,
  ReasoningEffort,
  Skill,
  TextVerbosity
} from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function fetchSkills(): Promise<Skill[]> {
  const response = await fetch(`${API_BASE_URL}/api/skills`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to load skills');
  }

  return response.json();
}

export async function executeInstruction(
  instruction: string
): Promise<ExecuteResponse> {
  const response = await fetch(`${API_BASE_URL}/api/assistant/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ instruction })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Execution failed');
  }

  return response.json();
}

export async function fetchOAuthStatus(): Promise<OAuthStatus> {
  const response = await fetch(`${API_BASE_URL}/api/oauth/status`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'OAuth status failed');
  }

  return response.json();
}

export async function convertMathImage(payload: {
  image: {
    dataUrl: string;
    name?: string;
    mimeType?: string;
  };
  provider: ProviderMode;
  model?: string;
  reasoningEffort?: ReasoningEffort;
  textVerbosity?: TextVerbosity;
  note?: string;
}): Promise<MathConvertResponse> {
  const response = await fetch(`${API_BASE_URL}/api/math/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Math conversion failed');
  }

  return response.json();
}
