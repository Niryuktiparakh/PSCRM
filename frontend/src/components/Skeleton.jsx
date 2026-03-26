// src/components/Skeleton.jsx
// Reusable skeleton loading components for PS-CRM
// Import the glassmorphism CSS file for full styling

import React from "react";

/**
 * Basic skeleton block with shimmer animation
 */
export function Skeleton({ className = "", style = {} }) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{
        minHeight: "1rem",
        ...style,
      }}
    />
  );
}

/**
 * Text line skeleton
 */
export function SkeletonText({ lines = 1, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className="skeleton h-3 rounded"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton with title, text, and optional avatar
 */
export function SkeletonCard({ 
  showAvatar = false, 
  lines = 3,
  className = "",
}) {
  return (
    <div className={`rounded-2xl border border-outline-variant bg-surface-container-low p-4 ${className}`}>
      <div className="flex items-start gap-3">
        {showAvatar && (
          <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
        )}
        <div className="flex-1 space-y-3">
          <div className="skeleton h-4 w-32 rounded" />
          {Array.from({ length: lines }).map((_, i) => (
            <div 
              key={i}
              className="skeleton h-3 rounded"
              style={{ width: `${90 - i * 15}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Stats card skeleton (for KPI blocks)
 */
export function SkeletonStat({ className = "" }) {
  return (
    <div className={`rounded-2xl border border-outline-variant bg-surface-container-low p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-6 w-16 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table row skeleton
 */
export function SkeletonTableRow({ columns = 5, className = "" }) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div 
            className="skeleton h-4 rounded"
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table skeleton with header and rows
 */
export function SkeletonTable({ 
  columns = 5, 
  rows = 4,
  className = "",
}) {
  return (
    <div className={`rounded-2xl border border-outline-variant overflow-hidden ${className}`}>
      <table className="w-full">
        <thead className="bg-surface-container">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="skeleton h-3 w-16 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Map placeholder skeleton
 */
export function SkeletonMap({ height = "420px", className = "" }) {
  return (
    <div 
      className={`rounded-2xl border border-outline-variant bg-surface-container-low overflow-hidden relative ${className}`}
      style={{ height }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-on-surface-variant font-medium">
            Loading map...
          </span>
        </div>
      </div>
      
      {/* Fake map controls */}
      <div className="absolute top-3 left-3">
        <div className="skeleton w-32 h-8 rounded-full" />
      </div>
      <div className="absolute bottom-3 right-3">
        <div className="skeleton w-8 h-20 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Dashboard skeleton - full page loading state
 */
export function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-6 p-6 lg:flex-row min-h-0 animate-in fade-in duration-300">
      {/* Left column */}
      <div className="flex flex-col gap-5 lg:w-[58%]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-8 w-48 rounded" />
            <div className="skeleton h-4 w-64 rounded" />
          </div>
          <div className="skeleton h-10 w-28 rounded-full" />
        </div>
        
        {/* Map toggle */}
        <div className="flex gap-2">
          <div className="skeleton h-8 w-28 rounded-full" />
          <div className="skeleton h-8 w-36 rounded-full" />
        </div>
        
        {/* Map */}
        <SkeletonMap />
        
        {/* Recent complaints */}
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
      
      {/* Right column */}
      <div className="flex flex-col gap-5 lg:w-[42%]">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
        
        {/* Overview card */}
        <SkeletonCard lines={4} />
        
        {/* Resolution card */}
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
          <div className="flex items-center gap-6">
            <div className="skeleton w-16 h-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Complaint list skeleton
 */
export function SkeletonComplaintList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="rounded-2xl border border-outline-variant bg-surface-container-low p-4"
        >
          <div className="flex items-start gap-3">
            <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="flex gap-2">
                <div className="skeleton h-5 w-20 rounded-full" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Admin KPI grid skeleton
 */
export function SkeletonKPIGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="skeleton h-3 w-20 rounded mb-2" />
          <div className="skeleton h-6 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Chat message skeleton
 */
export function SkeletonChatMessage({ isUser = false }) {
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
      <div className={`flex-1 max-w-[75%] space-y-2 ${isUser ? "items-end" : ""}`}>
        <div 
          className={`skeleton rounded-2xl p-4 ${isUser ? "rounded-br-sm" : "rounded-bl-sm"}`}
          style={{ height: "60px" }}
        />
      </div>
    </div>
  );
}

/**
 * Profile skeleton
 */
export function SkeletonProfile() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Avatar card */}
      <div className="rounded-2xl border border-outline-variant bg-gradient-to-br from-primary/10 to-surface-container p-6">
        <div className="flex items-center gap-5">
          <div className="skeleton w-20 h-20 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-6 w-40 rounded" />
            <div className="skeleton h-4 w-48 rounded" />
            <div className="skeleton h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
      
      {/* Form */}
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 space-y-4">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton h-12 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
          <div className="skeleton h-12 rounded-xl" />
        </div>
        <div className="skeleton h-10 w-32 rounded-full" />
      </div>
    </div>
  );
}

export default Skeleton;
