import React from 'react';

type PanelProps = {
  [key: string]: unknown;
  children?: React.ReactNode;
  title?: React.ReactNode;
};

declare const Panel: React.ComponentType<PanelProps>;
export default Panel;
