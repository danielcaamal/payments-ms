import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  NATS_SERVERS: string[];
}

const envVarsSchema = joi
  .object({
    PORT: joi.number().default(3000),
    STRIPE_SECRET_KEY: joi.string().required(),
    STRIPE_WEBHOOK_SECRET: joi.string().required(),
    STRIPE_SUCCESS_URL: joi.string().required(),
    STRIPE_CANCEL_URL: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
  })
  .unknown(true);

const { error, value } = envVarsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config: EnvVars = value;

export const envs = {
  PORT: config.PORT,
  STRIPE_SECRET_KEY: config.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: config.STRIPE_WEBHOOK_SECRET,
  STRIPE_SUCCESS_URL: config.STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL: config.STRIPE_CANCEL_URL,
  NATS_SERVERS: config.NATS_SERVERS,
};
