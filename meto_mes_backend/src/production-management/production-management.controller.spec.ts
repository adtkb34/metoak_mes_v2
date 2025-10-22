import { Test, TestingModule } from '@nestjs/testing';
import { ProductionManagementController } from './production-management.controller';

describe('ProductionManagementController', () => {
  let controller: ProductionManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionManagementController],
    }).compile();

    controller = module.get<ProductionManagementController>(
      ProductionManagementController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
