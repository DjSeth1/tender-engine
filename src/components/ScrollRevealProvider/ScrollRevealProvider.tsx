'use client';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function ScrollRevealProvider({ children }: Props) {
  const ref = useScrollReveal<HTMLDivElement>();

  return <div ref={ref}>{children}</div>;
}
