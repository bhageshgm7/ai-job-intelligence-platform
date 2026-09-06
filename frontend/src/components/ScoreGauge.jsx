import React from 'react';

export const ScoreGauge = ({ score = 0, size = 160, strokeWidth = 14 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const offset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#f43f5e'; // Red
  let badgeText = 'Low Match';
  if (clampedScore >= 75) {
    strokeColor = '#10b981'; // Green
    badgeText = 'Strong Match';
  } else if (clampedScore >= 50) {
    strokeColor = '#f59e0b'; // Amber
    badgeText = 'Moderate Match';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: size * 0.26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {clampedScore}%
          </span>
          <span style={{ fontSize: size * 0.085, fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
            MATCH
          </span>
        </div>
      </div>
      <span style={{
        marginTop: '12px',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: strokeColor,
        background: `${strokeColor}18`,
        border: `1px solid ${strokeColor}40`,
        padding: '3px 12px',
        borderRadius: '999px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}>
        {badgeText}
      </span>
    </div>
  );
};
