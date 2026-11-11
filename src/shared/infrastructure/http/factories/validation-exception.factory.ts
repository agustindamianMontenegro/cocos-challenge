import { BadRequestException, ValidationError } from '@nestjs/common';

/** Mensajes propios para las restricciones que agrega el ValidationPipe (vienen en inglés). */
const PIPE_MESSAGES: Readonly<Record<string, (field: string) => string>> = {
  whitelistValidation: (field) => `El campo ${field} no está permitido.`,
};

/** Junta todos los errores de validación en mensajes en español. */
export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({ message: messagesOf(errors, '') });
}

function messagesOf(errors: readonly ValidationError[], parent: string): string[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(
      ([constraint, message]) => PIPE_MESSAGES[constraint]?.(field) ?? message,
    );
    return [...own, ...messagesOf(error.children ?? [], field)];
  });
}
