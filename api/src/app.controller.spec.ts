import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return welcome message object', () => {
      const result = appController.getHello();
      expect(result).toHaveProperty('message', 'Welcome to BakeWind API');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('documentation', '/api/v1/docs');
      expect(result).toHaveProperty('timestamp');
    });
  });
});
