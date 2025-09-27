import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should validate valid JWT token', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      role: 'customer'
    };

    jest.spyOn(jwtService, 'verify').mockReturnValue(mockUser);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer valid-jwt-token'
          }
        })
      })
    } as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should reject request without authorization header', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {}
        })
      })
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject malformed authorization header', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'InvalidFormat token'
          }
        })
      })
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject invalid JWT token', async () => {
    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer invalid-jwt-token'
          }
        })
      })
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should extract user from valid token', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      role: 'admin'
    };

    jest.spyOn(jwtService, 'verify').mockReturnValue(mockUser);

    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-jwt-token'
      }
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest
      })
    } as ExecutionContext;

    await guard.canActivate(mockContext);
    expect(mockRequest['user']).toEqual(mockUser);
  });
});