import { SaveAccountOptions } from '@modules/account/application/ports/out/options/save-account.options';
import { AccountEvent } from '@modules/account/domain/events/account.event';

export interface StoredEvent {
  event: AccountEvent;
  options: SaveAccountOptions;
}
