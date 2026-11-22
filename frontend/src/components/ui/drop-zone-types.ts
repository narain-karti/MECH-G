// Hairline UI · drop-zone · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

import type * as React from 'react';

export type DropZoneStatus = 'ready' | 'uploading' | 'done' | 'error';

export interface DropZoneFile {
  id: string;
  file: File;
  status: DropZoneStatus;
  progress: number;
  error?: string;
}

export type DropZoneUpload = (
  file: File,
  context: { progress: (fraction: number) => void; signal: AbortSignal },
) => void | Promise<void>;

export interface DropZoneRejection {
  file: File;
  code: 'type' | 'size' | 'count' | 'duplicate';
  reason: string;
}

export interface DropZoneHandle {
  drag: (clientX: number, clientY: number, types?: string[]) => boolean;
  cancel: () => void;
  drop: (files: File[], at?: { x: number; y: number }) => void;
  browse: () => void;
}

export interface DropZoneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop' | 'title'> {
  onUpload?: DropZoneUpload;
  onFilesChange?: (files: File[]) => void;
  onFilesRejected?: (rejections: DropZoneRejection[]) => void;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  title?: string;
  hint?: string;
  disabled?: boolean;
  ref?: React.Ref<DropZoneHandle>;
}
