import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Get, ValidationPipe, UsePipes } from '@nestjs/common';
import { WebhookDto } from './dto/webhook.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth/auth.service';
import { OverpassService } from './overpass.service';
import { JsonParsePipe } from './pipes/json-parse.pipe';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly authService: AuthService,
    private readonly overpassService: OverpassService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async handleWebhook(@Body() webhookDto: WebhookDto) {
    console.log('DTO', webhookDto);
    const attractions = await this.overpassService.findNearbyAttractions(
      webhookDto.lat,
      webhookDto.lng,
      webhookDto.radius
    );

    return {
      status: 'success',
      message: 'Webhook processed successfully',
      data: {
        coordinates: webhookDto,
        attractions,
      },
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