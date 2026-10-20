import * as React from 'react';

/**
 * Expand (focus) mode — a workspace (the Enquiry tab) asks the app shell to hide the
 * navigation sidebar, the record pane and the agent panel for maximum width.
 * `focus` is only true while an expandable workspace is active (`setExpandable`), so
 * leaving the tab collapses it and returning restores it.
 */
interface FocusContextValue {
  /** Expanded right now. */
  focus: boolean;
  /** Turn expand on / off (the user's choice). */
  setFocus: (on: boolean) => void;
  /** Report whether an expandable workspace (e.g. the Enquiry tab) is showing. */
  setExpandable: (on: boolean) => void;
}

const FocusContext = React.createContext<FocusContextValue>({
  focus: false,
  setFocus: () => {},
  setExpandable: () => {},
});

export function FocusProvider({ value, children }: { value: FocusContextValue; children: React.ReactNode }) {
  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export const useFocusMode = () => React.useContext(FocusContext);
