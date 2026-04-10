import type { Transaction } from '../../types/Transactions';

export type { Transaction };

export interface QuerySummary {
  answer: string;
  total: number;
  count: number;
  transactions: Transaction[];
}

export interface OrchestratorResponse {
  success: boolean;
  result: Record<string, unknown>;
}

export interface AddQueryResponse {
  success: boolean;
  result: {
    intent: 'add' | 'query';
    data: Transaction[];
  };
}

export interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionCreated: (transaction: Transaction) => void;
}
