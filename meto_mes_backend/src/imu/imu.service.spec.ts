import { Test, TestingModule } from '@nestjs/testing';
import { ImuService } from './imu.service';

describe('ImuService', () => {
  let service: ImuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImuService],
    }).compile();

    service = module.get<ImuService>(ImuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
