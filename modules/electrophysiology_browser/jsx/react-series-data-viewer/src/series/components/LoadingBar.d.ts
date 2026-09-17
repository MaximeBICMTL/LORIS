import React from 'react';

declare const LoadingBar: React.ComponentType<{
  progress: number;
  onTransitionEnd?: React.TransitionEventHandler<HTMLDivElement>;
  t: (key: string, options?: Record<string, unknown>) => string;
  wrapperStyle?: React.CSSProperties;
}>;
export default LoadingBar;
