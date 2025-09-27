import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Welcome to BakeWind API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      documentation: '/api/v1/docs',
    };
  }
}
