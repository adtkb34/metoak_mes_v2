import { Test, TestingModule } from '@nestjs/testing';
import { StereoPostcheckController } from './stereo-postcheck.controller';

describe('StereoPostcheckController', () => {
  let controller: StereoPostcheckController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StereoPostcheckController],
    }).compile();

    controller = module.get<StereoPostcheckController>(StereoPostcheckController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
