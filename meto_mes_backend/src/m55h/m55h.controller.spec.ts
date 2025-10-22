import { Test, TestingModule } from '@nestjs/testing';
import { M55hController } from './m55h.controller';

describe('M55hController', () => {
  let controller: M55hController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [M55hController],
    }).compile();

    controller = module.get<M55hController>(M55hController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
