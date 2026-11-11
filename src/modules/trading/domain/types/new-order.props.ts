import { OrderProps } from './order.props';

/** Datos para crear una orden; el estado y las fechas los pone la entidad. */
export type NewOrder = Omit<OrderProps, 'status' | 'rejectionReason' | 'createdAt' | 'updatedAt'>;
