import Stripe from 'stripe';
import { Request, Response } from 'express';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';

import { envs, NATS_SERVICE } from 'src/config';
import { PaymentSessionDto, PaymentSuccessDto } from './dto';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.STRIPE_SECRET_KEY);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private paymentSessionAdapter(
    paymentSessionDto: PaymentSessionDto,
  ): Stripe.Checkout.SessionCreateParams.LineItem[] {
    return paymentSessionDto.items.map((item) => {
      return {
        price_data: {
          currency: paymentSessionDto.currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Number((item.price * 100).toFixed(0)),
        },
        quantity: item.quantity,
      };
    });
  }

  createPaymentSession = async (paymentSessionDto: PaymentSessionDto) => {
    const session = await this.stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          orderId: paymentSessionDto.orderId,
        },
      },
      line_items: this.paymentSessionAdapter(paymentSessionDto),
      mode: 'payment',
      success_url: envs.STRIPE_SUCCESS_URL,
      cancel_url: envs.STRIPE_CANCEL_URL,
    });

    return session;
  };

  stripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        envs.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'charge.succeeded') {
      const chargeSucceeded = event.data.object;
      await this.updateOrderOnPaymentSuccess(chargeSucceeded);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  };

  updateOrderOnPaymentSuccess = async (eventData: Stripe.Charge) => {
    try {
      const payload: PaymentSuccessDto = {
        orderId: eventData.metadata.orderId,
        stripePaymentId: eventData.id,
        receiptUrl: eventData.receipt_url,
      };

      return this.client.send({ cmd: 'payment_succeeded' }, payload);
    } catch (error) {
      throw new RpcException({
        message: 'Error updating the order',
        status: HttpStatus.CONFLICT,
      });
    }
  };
}
