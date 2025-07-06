// Basic select component for compatibility
import React from "react";

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange?.(e.target.value)}
      className="border rounded px-2 py-1"
    >
      {children}
    </select>
  );
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  return <option value={value}>{children}</option>;
}

export interface SelectTriggerProps {
  children: React.ReactNode;
}

export function SelectTrigger({ children }: SelectTriggerProps) {
  return <div>{children}</div>;
}

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return <span>{placeholder}</span>;
}

export interface SelectContentProps {
  children: React.ReactNode;
}

export function SelectContent({ children }: SelectContentProps) {
  return <div>{children}</div>;
}
