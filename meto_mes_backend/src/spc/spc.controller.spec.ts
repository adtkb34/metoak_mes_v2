import { Test, TestingModule } from '@nestjs/testing';
import { SpcController } from './spc.controller';

describe('SpcController', () => {
  let controller: SpcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpcController],
    }).compile();

    controller = module.get<SpcController>(SpcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
