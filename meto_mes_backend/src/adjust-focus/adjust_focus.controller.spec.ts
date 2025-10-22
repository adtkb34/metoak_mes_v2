import { Test, TestingModule } from '@nestjs/testing';
import { AdjustFocusController } from './adjust_focus.controller';

describe('AdjustFocusController', () => {
  let controller: AdjustFocusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdjustFocusController],
    }).compile();

    controller = module.get<AdjustFocusController>(AdjustFocusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
