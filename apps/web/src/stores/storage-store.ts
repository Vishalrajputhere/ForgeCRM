/**
 * ForgeCRM — Storage & Document Attachments Zustand Store
 *
 * Client-side state management for file upload progress, active attachment list,
 * and document preview modals.
 *
 * Documentation: docs/04_Frontend/404_STATE_MANAGEMENT.md
 */

import { create } from 'zustand';

import type { DocumentAttachmentResponse } from '@/types';

interface StorageStore {
  attachments: DocumentAttachmentResponse[];
  isUploading: boolean;
  uploadProgress: number;

  setAttachments: (attachments: DocumentAttachmentResponse[]) => void;
  setIsUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
}

export const useStorageStore = create<StorageStore>((set) => ({
  attachments: [],
  isUploading: false,
  uploadProgress: 0,

  setAttachments: (attachments) => set({ attachments }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
}));
