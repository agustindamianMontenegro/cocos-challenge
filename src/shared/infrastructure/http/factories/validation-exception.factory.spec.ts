import { ValidationError } from '@nestjs/common';
import { validationExceptionFactory } from './validation-exception.factory';

const error = (property: string, constraints: Record<string, string>, children: ValidationError[] = []): ValidationError => ({
  property,
  constraints,
  children,
});

describe('validationExceptionFactory', () => {
  it('traduce los campos no permitidos y conserva los mensajes propios', () => {
    const exception = validationExceptionFactory([
      error('foo', { whitelistValidation: 'property foo should not exist' }),
      error('size', { isInt: 'size tiene que ser un entero.' }),
      error('parent', {}, [error('child', { whitelistValidation: 'x' })]),
    ]);

    expect(exception.getResponse()).toEqual({
      message: ['El campo foo no está permitido.', 'size tiene que ser un entero.', 'El campo parent.child no está permitido.'],
    });
  });

  it('no repite un mensaje que comparten dos restricciones del mismo campo', () => {
    const message = 'userId es obligatorio y tiene que ser un entero mayor a cero.';
    const exception = validationExceptionFactory([error('userId', { isInt: message, min: message })]);

    expect(exception.getResponse()).toEqual({ message: [message] });
  });
});
