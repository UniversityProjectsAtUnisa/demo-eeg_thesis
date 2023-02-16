import React from "react";

export interface DetectionIndicatorProps {
  color: string;
}

export const DetectionIndicator = ({ color }: DetectionIndicatorProps) => (
  <div className="detection-indicator" style={{ backgroundColor: color }} />
);
