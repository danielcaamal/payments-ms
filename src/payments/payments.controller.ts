import { Request, Response } from 'express';
import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  @MessagePattern({ cmd: 'create_payment_session' })
  async createPaymentSession(@Body() paymentSessionDto: PaymentSessionDto) {
    return await this.paymentsService.createPaymentSession(paymentSessionDto);
  }

  @Get('success')
  async paymentSuccess() {
    return {
      message: 'Payment successful',
    };
  }

  @Get('cancel')
  async paymentCancel() {
    return {
      message: 'Payment cancelled',
    };
  }

  @Post('webhook')
  async paymentWebhook(@Req() req: Request, @Res() res: Response) {
    return await this.paymentsService.stripeWebhook(req, res);
  }
}
