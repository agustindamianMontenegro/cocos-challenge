import { ApiProperty } from '@nestjs/swagger';

export class BalanceResponseDto {
  @ApiProperty({ example: '707100.00' }) total!: string;
  @ApiProperty({ example: '125500.00' }) reserved!: string;
  @ApiProperty({ example: '581600.00' }) available!: string;
}
