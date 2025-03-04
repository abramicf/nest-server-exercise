import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { AuthModule } from '../auth/auth.module';
import { OverpassService } from './overpass.service';

@Module({
  imports: [AuthModule],
  controllers: [WebhookController],
  providers: [OverpassService],
})
export class WebhookModule {} 