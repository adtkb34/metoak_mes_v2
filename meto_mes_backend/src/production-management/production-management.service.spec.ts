import { Test, TestingModule } from '@nestjs/testing';
import { ProductionManagementService } from './production-management.service';

describe('ProductionManagementService', () => {
  let service: ProductionManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionManagementService],
    }).compile();

    service = module.get<ProductionManagementService>(
      ProductionManagementService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
