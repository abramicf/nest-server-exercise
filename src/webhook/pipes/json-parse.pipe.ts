import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class JsonParsePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format');
      }
    }
    return value;
  }
} 