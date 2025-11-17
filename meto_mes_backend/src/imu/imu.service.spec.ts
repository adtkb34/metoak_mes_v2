import { Test, TestingModule } from '@nestjs/testing';
import { ImuCalibService } from './imu.service';

describe('ImuCalibService', () => {
  let service: ImuCalibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImuCalibService],
    }).compile();

    service = module.get<ImuCalibService>(ImuCalibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
