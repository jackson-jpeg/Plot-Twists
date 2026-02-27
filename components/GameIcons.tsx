'use client'

import React from 'react'

interface IconProps {
  size?: number
  className?: string
  color?: string
}

export function TypewriterIcon({ size = 48, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="14" width="32" height="6" rx="2" stroke={color} strokeWidth="2.5" />
      <rect x="6" y="24" width="36" height="18" rx="3" stroke={color} strokeWidth="2.5" />
      <rect x="12" y="30" width="4" height="3" rx="0.5" fill={color} opacity="0.6" />
      <rect x="18" y="30" width="4" height="3" rx="0.5" fill={color} opacity="0.6" />
      <rect x="24" y="30" width="4" height="3" rx="0.5" fill={color} opacity="0.6" />
      <rect x="30" y="30" width="4" height="3" rx="0.5" fill={color} opacity="0.6" />
      <rect x="15" y="35" width="18" height="3" rx="0.5" fill={color} opacity="0.4" />
      <path d="M16 14V10C16 8.89543 16.8954 8 18 8H30C31.1046 8 32 8.89543 32 10V14" stroke={color} strokeWidth="2.5" />
      <line x1="20" y1="11" x2="28" y2="11" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

export function CheckCircleIcon({ size = 20, className = '', color = '#4CAF50' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" fill={color} opacity="0.15" />
      <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M6 10L9 13L14 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SpinnerIcon({ size = 20, className = '', color = '#F59E42' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="2" opacity="0.25" />
      <path d="M10 2C14.4183 2 18 5.58172 18 10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function PendingCircleIcon({ size = 20, className = '', color = '#9B9590' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
    </svg>
  )
}

export function PauseIcon({ size = 24, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="4" width="4" height="16" rx="1.5" fill={color} />
      <rect x="14" y="4" width="4" height="16" rx="1.5" fill={color} />
    </svg>
  )
}

export function PlayIcon({ size = 24, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M7 4.5V19.5C7 20.3284 7.89543 20.8284 8.6 20.4L20.4 13.4C21.1333 12.9 21.1333 11.1 20.4 10.6L8.6 3.6C7.89543 3.17157 7 3.67157 7 4.5Z" fill={color} />
    </svg>
  )
}

export function VoteCheckIcon({ size = 24, className = '', color = '#F59E42' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill={color} />
      <path d="M7 12L10.5 15.5L17 8.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StatusDot({ status, size = 10 }: { status: 'done' | 'active' | 'waiting'; size?: number }) {
  const colors = {
    done: '#4CAF50',
    active: '#F59E42',
    waiting: '#9B9590',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="5" r="4" fill={colors[status]} />
    </svg>
  )
}

export function ChaosIcon({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2C10 2 12 6 16 6C16 6 12 8 12 12C12 12 10 8 6 8C6 8 10 6 10 2Z" fill={color} />
      <path d="M4 12C4 12 5 14 7 14C7 14 5 15 5 17C5 17 4 15 2 15C2 15 4 14 4 12Z" fill={color} opacity="0.6" />
      <path d="M14 13C14 13 15 15 17 15C17 15 15 16 15 18C15 18 14 16 12 16C12 16 14 15 14 13Z" fill={color} opacity="0.6" />
    </svg>
  )
}

export function RetryIcon({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10C17 13.866 13.866 17 10 17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M7 10L3 10L3 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WarningIcon({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L18 17H2L10 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="10" y1="8" x2="10" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="1" fill={color} />
    </svg>
  )
}

export function TrophyIcon({ size = 24, className = '', color = '#F59E42' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M8 21H16M12 17V21M6 4H18V8C18 11.3137 15.3137 14 12 14C8.68629 14 6 11.3137 6 8V4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 7H4C3.44772 7 3 7.44772 3 8V9C3 10.6569 4.34315 12 6 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 7H20C20.5523 7 21 7.44772 21 8V9C21 10.6569 19.6569 12 18 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function EyeIcon({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M2 10C2 10 5 4 10 4C15 4 18 10 18 10C18 10 15 16 10 16C5 16 2 10 2 10Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="3" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function BallotIcon({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M7 7H13M7 10H13M7 13H11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function PopcornIcon({ size = 24, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M7 8L5 20H19L17 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 8C7 5.5 8.5 4 10 4C10.8 4 11.4 4.3 12 5C12.6 4.3 13.2 4 14 4C15.5 4 17 5.5 17 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="8" x2="12" y2="18" stroke={color} strokeWidth="1.5" opacity="0.4" />
    </svg>
  )
}

export function CrownIcon({ size = 16, className = '', color = '#F59E42' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12L3 5L6 8L8 3L10 8L13 5L14 12H2Z" fill={color} />
    </svg>
  )
}

export function DoorIcon({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="2" width="12" height="16" rx="1.5" stroke={color} strokeWidth="1.5" />
      <circle cx="13" cy="10" r="1" fill={color} />
    </svg>
  )
}

export function ShareIcon({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 3V13M10 3L6 7M10 3L14 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function CopyIcon({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="10" height="12" rx="1.5" stroke={color} strokeWidth="1.5" />
      <path d="M14 6V4.5C14 3.67 13.33 3 12.5 3H5.5C4.67 3 4 3.67 4 4.5V14.5C4 15.33 4.67 16 5.5 16H6" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function StarIcon({ size = 20, className = '', color = '#F59E42' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L12.5 7.5L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7.5L10 2Z" fill={color} />
    </svg>
  )
}

export function MedalIcon({ size = 20, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="12" r="5" stroke={color} strokeWidth="1.5" />
      <path d="M7 7L5 2H8L10 5L12 2H15L13 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 11L9.5 12.5L12 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
