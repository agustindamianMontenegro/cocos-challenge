import { RejectionReason } from './rejection-reason.type';

/** Resultado de aplicar la orden sobre la cuenta: aceptada, o rechazada por falta de recursos. */
export type ExecutionOutcome = { accepted: true } | { accepted: false; reason: RejectionReason };
