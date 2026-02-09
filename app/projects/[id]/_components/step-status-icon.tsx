'use client';

import React from 'react';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

export const STEP_STATUS_ICON: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle2 size={16} className="text-green-500" />,
  IN_PROGRESS: <Clock size={16} className="text-blue-500" />,
  PLANNED: <Circle size={16} className="text-gray-300" />,
  SKIPPED: <Circle size={16} className="text-gray-200" />,
  ON_HOLD: <Clock size={16} className="text-yellow-500" />,
};
