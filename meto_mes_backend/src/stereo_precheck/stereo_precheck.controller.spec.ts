import { Test, TestingModule } from '@nestjs/testing';
import { StereoPrecheckController } from './stereo_precheck.controller';

describe('StereoPrecheckController', () => {
  let controller: StereoPrecheckController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StereoPrecheckController],
    }).compile();

    controller = module.get<StereoPrecheckController>(StereoPrecheckController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
