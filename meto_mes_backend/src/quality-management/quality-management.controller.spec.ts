import { Test, TestingModule } from '@nestjs/testing';
import { QualityManagementController } from './quality-management.controller';

describe('QualityManagementController', () => {
  let controller: QualityManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QualityManagementController],
    }).compile();

    controller = module.get<QualityManagementController>(
      QualityManagementController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
