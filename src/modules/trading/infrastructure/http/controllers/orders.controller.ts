import { BadRequestException, Body, Controller, HttpStatus, Inject, Param, ParseUUIDPipe, Patch, Post, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { CancelOrderUseCase } from '@modules/trading/application/ports/in/interfaces/cancel-order.use-case';
import { PlaceOrderUseCase } from '@modules/trading/application/ports/in/interfaces/place-order.use-case';
import { CANCEL_ORDER, PLACE_ORDER } from '@modules/trading/application/ports/in/tokens';
import { OrderResponseDto } from '@modules/trading/infrastructure/http/dto/order.response.dto';
import { PlaceOrderRequestDto } from '@modules/trading/infrastructure/http/dto/place-order.request.dto';
import { toOrderResponse, toPlaceOrderCommand } from '@modules/trading/infrastructure/http/mappers/order-http.mapper';

const orderIdPipe = new ParseUUIDPipe({
  exceptionFactory: () => new BadRequestException('El id de la orden tiene que ser un UUID.'),
});

/** Adaptador HTTP: solo conoce los puertos de entrada. */
@ApiTags('Órdenes')
@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(PLACE_ORDER) private readonly placeOrder: PlaceOrderUseCase,
    @Inject(CANCEL_ORDER) private readonly cancelOrder: CancelOrderUseCase,
  ) {}

  /**
   * 201 si se creó (FILLED, NEW o REJECTED); 200 si es un reintento con los mismos datos.
   * Con `passthrough` solo se fija el código: la respuesta la arma Nest (interceptores y serialización).
   */
  @Post()
  @ApiOperation({ summary: 'Enviar una orden MARKET o LIMIT' })
  @ApiCreatedResponse({ type: OrderResponseDto, description: 'Orden creada: FILLED, NEW o REJECTED.' })
  @ApiOkResponse({ type: OrderResponseDto, description: 'Reintento: la orden ya existía con los mismos datos.' })
  @ApiBadRequestResponse({ description: 'Pedido inválido.' })
  @ApiConflictResponse({ description: 'El orderId ya se usó con otros datos, o el instrumento no tiene cotización.' })
  async place(
    @Body() body: PlaceOrderRequestDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<OrderResponseDto> {
    const { order, created } = await this.placeOrder.execute(toPlaceOrderCommand(body));
    reply.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return toOrderResponse(order);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una orden NEW y liberar lo comprometido' })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiNotFoundResponse({ description: 'La orden no existe.' })
  @ApiConflictResponse({ description: 'La orden no está en NEW.' })
  async cancel(@Param('id', orderIdPipe) id: string): Promise<OrderResponseDto> {
    return toOrderResponse(await this.cancelOrder.execute(id));
  }
}
