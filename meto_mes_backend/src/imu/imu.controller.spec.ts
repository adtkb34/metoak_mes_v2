import { Test, TestingModule } from '@nestjs/testing';
import { ImuController } from './imu.controller';

describe('ImuController', () => {
  let controller: ImuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImuController],
    }).compile();

    controller = module.get<ImuController>(ImuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
