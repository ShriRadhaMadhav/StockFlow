import { apiClient } from './client';
import type { ApiResponse } from './client';

export const ocrApi = {
  uploadBill: (file: File) => {
    const formData = new FormData();
    formData.append('billImage', file);
    return apiClient.post<never, ApiResponse<any>>('/ocr/upload-bill', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};
