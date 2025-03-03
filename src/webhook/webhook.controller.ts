import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { WebhookDto } from './dto/webhook.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() webhookDto: WebhookDto) {
    // Here you can add your business logic to handle the webhook
    return {
      status: 'success',
      message: 'Webhook received successfully',
      data: webhookDto
    };
  }

  @Get('test-token')
  @HttpCode(HttpStatus.OK)
  async generateTestToken() {
    const testUsername = 'test-user';
    const token = this.authService.generateToken(testUsername);
    
    return {
      status: 'success',
      message: 'Test token generated successfully',
      data: {
        token,
        username: testUsername,
        usage: 'Add this token to your request header as: Authorization: Bearer <token>'
      }
    };
  }
} 