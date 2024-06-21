import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.STRIPE_SECRET_KEY);

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
      const chargeSucceeded = event.data.object as Stripe.Charge;
      console.log({
        metadata: chargeSucceeded.metadata,
      });
      const orderId = chargeSucceeded.metadata.orderId;
      // TODO: CAll order service to update order status
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  };
}
