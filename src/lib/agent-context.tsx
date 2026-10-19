import * as React from 'react';

/**
 * What the agent panel is currently scoped to — set by "Ask Atlas" buttons so the
 * chat knows the context (e.g. one rate's charges) and can act on it.
 */
export interface AgentScope {
  /** Short label for the context chip, e.g. "Maersk · MSK-FAK-2611-0418". */
  label: string;
  /** One line explaining what Atlas can do here. */
  hint?: string;
  /** Example prompts shown as quick actions. */
  suggestions?: string[];
  /**
   * Try to act on the user's message within this scope. Returns a summary of what
   * changed, or null when the request couldn't be mapped to an action.
   */
  handle?: (text: string) => string | null;
}

interface AgentContextValue {
  scope: AgentScope | null;
  /** Scope the panel and open it. */
  askAtlas: (scope: AgentScope) => void;
  clearScope: () => void;
}

const AgentContext = React.createContext<AgentContextValue>({
  scope: null,
  askAtlas: () => {},
  clearScope: () => {},
});

export function AgentProvider({
  value,
  children,
}: {
  value: AgentContextValue;
  children: React.ReactNode;
}) {
  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export const useAgent = () => React.useContext(AgentContext);
