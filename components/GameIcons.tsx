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
