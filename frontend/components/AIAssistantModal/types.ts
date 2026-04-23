import type { Transaction, TransactionPayload } from '../../types/Transactions';

export type { Transaction, TransactionPayload };

interface AddIntentPayload {
  intent: 'add';
  data: {
    transactions: unknown[];
  };
}

interface QueryIntentPayload {
  intent: 'query';
  data: Record<string, unknown>;
}

type MCPIntentPayload = AddIntentPayload | QueryIntentPayload;

export interface QuerySummary {
  answer: string;
  total: number;
  count: number;
  transactions: Transaction[];
}

export interface OrchestratorResponse {
  success: boolean;
  result: MCPIntentPayload;
}

export interface AddQueryResponse {
  success: boolean;
  result: {
    intent: 'add' | 'query';
    data: Transaction[];
  };
}

export interface DraftPreparationResponse {
  success: boolean;
  result: TransactionPayload[];
}

export interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDraftsPrepared: (drafts: TransactionPayload[]) => void;
}
