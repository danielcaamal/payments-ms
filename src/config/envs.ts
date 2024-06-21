import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
}

const envVarsSchema = joi
  .object({
    PORT: joi.number().default(3000),
    STRIPE_SECRET_KEY: joi.string().required(),
    STRIPE_WEBHOOK_SECRET: joi.string().required(),
    STRIPE_SUCCESS_URL: joi.string().required(),
    STRIPE_CANCEL_URL: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envVarsSchema.validate(process.env);

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
};
