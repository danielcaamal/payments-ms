import { Module } from '@nestjs/common';

import { PaymentsModule } from './payments/payments.module';
import { HealthCheckController } from './health-check/health-check.controller';

@Module({
  imports: [PaymentsModule],
  controllers: [HealthCheckController],
  providers: [],
})
export class AppModule {}
