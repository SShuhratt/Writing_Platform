'use client';

import React from 'react';
import { MotionConfig } from 'framer-motion';

export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
};

