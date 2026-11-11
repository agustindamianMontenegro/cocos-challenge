import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { ConflictError } from '@shared/domain/errors/conflict.error';
import { InvalidRequestError } from '@shared/domain/errors/invalid-request.error';
import { NotFoundError } from '@shared/domain/errors/not-found.error';
import { INTERNAL_ERROR, toErrorResponse } from './to-error-response';

class MissingThing extends NotFoundError {
  readonly code = 'THING_NOT_FOUND';
}
class BusyThing extends ConflictError {
  readonly code = 'THING_BUSY';
}
class BadThing extends InvalidRequestError {
  readonly code = 'THING_INVALID';
}

describe('toErrorResponse', () => {
  it.each([
    [new MissingThing('No existe.'), 404, 'THING_NOT_FOUND'],
    [new BusyThing('Ocupado.'), 409, 'THING_BUSY'],
    [new BadThing('Inválido.'), 400, 'THING_INVALID'],
  ])('traduce los errores de negocio por categoría', (error, status, code) => {
    expect(toErrorResponse(error)).toEqual({ status, body: { error: { code, message: error.message } } });
  });

  it('junta los mensajes de validación', () => {
    const response = toErrorResponse(new BadRequestException({ message: ['a', 'b'] }));
    expect(response).toEqual({ status: 400, body: { error: { code: 'INVALID_REQUEST', message: 'a; b' } } });
  });

  it('respeta los errores HTTP de Nest', () => {
    expect(toErrorResponse(new NotFoundException('Ruta inexistente')).status).toBe(404);
  });

  it('acepta errores 4xx de Fastify', () => {
    const error = Object.assign(new Error('Body is not valid JSON'), { statusCode: 400 });
    expect(toErrorResponse(error).body.error).toEqual({
      code: 'INVALID_REQUEST',
      message: 'No se pudo leer el pedido: el cuerpo tiene que ser un JSON válido.',
    });
  });

  it('traduce los errores de Fastify que Nest envuelve en una HttpException', () => {
    const cause = Object.assign(new Error('Body is not valid JSON'), { code: 'FST_ERR_CTP_INVALID_JSON_BODY' });
    const response = toErrorResponse(new HttpException('Body is not valid JSON', 400, { cause }));
    expect(response.body.error.message).toBe('No se pudo leer el pedido: el cuerpo tiene que ser un JSON válido.');
  });

  it('traduce la ruta inexistente de Nest', () => {
    expect(toErrorResponse(new NotFoundException('Cannot GET /nada')).body.error.message).toBe(
      'No existe el recurso pedido.',
    );
  });

  it('un error técnico es 500 y no expone detalles', () => {
    expect(toErrorResponse(new Error('connection refused'))).toEqual(INTERNAL_ERROR);
  });
});
