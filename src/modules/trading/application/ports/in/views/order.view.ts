import { Money } from '@shared/domain/value-objects/money';

/** Una orden tal como la devuelven los casos de uso: datos, no la entidad. */
export interface OrderView {
  id: string;
  userId: number;
  instrumentId: number;
  side: string;
  type: string;
  size: number;
  price: Money;
  status: string;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
