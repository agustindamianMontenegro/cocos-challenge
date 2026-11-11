import { AccountEvent } from '@modules/account/domain/events/account.event';
import { CorruptedAccountStreamError } from '@modules/account/infrastructure/persistence/errors/corrupted-account-stream.error';
import { Upcaster } from '@modules/account/infrastructure/persistence/types/upcaster.type';
import { fromStoredEvent, toStoredEvent } from './account-event.mapper';

describe('account-event.mapper', () => {
  const events: AccountEvent[] = [
    { type: 'CashDeposited', amount: '1000000' },
    { type: 'CashWithdrawn', amount: '100000' },
    { type: 'TradeExecuted', orderId: 'o', instrumentId: 47, side: 'BUY', quantity: 50, price: '930' },
    { type: 'FundsReserved', orderId: 'o5', amount: '35500' },
    { type: 'SharesReserved', orderId: 'o6', instrumentId: 47, quantity: 10 },
    { type: 'ReservationReleased', orderId: 'o5' },
  ];

  it.each(events)('guarda y recupera $type sin perder datos', (event) => {
    const stored = toStoredEvent(event);
    expect(stored.type).toBe(event.type);
    expect(stored.payload).not.toHaveProperty('type');
    expect(fromStoredEvent(JSON.parse(JSON.stringify(stored)))).toEqual(event);
  });

  it('rechaza un tipo desconocido como error técnico', () => {
    expect(() => fromStoredEvent({ type: 'Unknown', schemaVersion: 1, payload: {} })).toThrow(
      CorruptedAccountStreamError,
    );
  });

  it('rechaza un payload que no es un objeto', () => {
    expect(() => fromStoredEvent({ type: 'CashDeposited', schemaVersion: 1, payload: null })).toThrow(
      CorruptedAccountStreamError,
    );
  });

  it('guarda la versión vigente del esquema', () => {
    expect(toStoredEvent({ type: 'CashDeposited', amount: '10' }).schemaVersion).toBe(1);
  });

  describe('upcasting', () => {
    const v1 = {
      type: 'TradeExecuted',
      schemaVersion: 1,
      payload: { orderId: 'o', instrumentId: 47, side: 'BUY', quantity: 1, price: '10' },
    };
    const schema = {
      currentVersions: { TradeExecuted: 3 },
      upcasters: new Map<string, Upcaster>([
        ['TradeExecuted@1', (p: Record<string, unknown>) => ({ ...p, fee: '0' })],
        ['TradeExecuted@2', (p: Record<string, unknown>) => ({ ...p, currency: 'ARS' })],
      ]),
    };

    it('lleva un hecho viejo a la versión vigente aplicando los upcasters en cadena', () => {
      expect(fromStoredEvent(v1, schema)).toEqual({ ...v1.payload, fee: '0', currency: 'ARS', type: 'TradeExecuted' });
    });

    it('si falta un upcaster es un error técnico', () => {
      const incomplete = { ...schema, upcasters: new Map([...schema.upcasters].slice(0, 1)) };
      expect(() => fromStoredEvent(v1, incomplete)).toThrow('falta el upcaster de TradeExecuted para la versión 2');
    });

    it('un hecho de una versión más nueva que el código no se interpreta', () => {
      expect(() => fromStoredEvent({ ...v1, schemaVersion: 4 }, schema)).toThrow(CorruptedAccountStreamError);
    });
  });
});
