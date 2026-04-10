import type { TransactionPayload } from '../../types/Transactions';

export type { TransactionPayload };

export interface OCRResponse {
  success: boolean;
  result: TransactionPayload[];
}

export interface ReceiptOCRPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDraftPrepared: (draft: TransactionPayload) => void;
}
