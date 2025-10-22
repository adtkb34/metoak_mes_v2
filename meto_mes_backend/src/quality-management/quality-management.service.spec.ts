import { Test, TestingModule } from '@nestjs/testing';
import { QualityManagementService } from './quality-management.service';

describe('QualityManagementService', () => {
  let service: QualityManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QualityManagementService],
    }).compile();

    service = module.get<QualityManagementService>(QualityManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
