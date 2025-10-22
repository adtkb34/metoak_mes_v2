import { Test, TestingModule } from '@nestjs/testing';
import { K3cloudController } from './k3cloud.controller';

describe('K3cloudController', () => {
  let controller: K3cloudController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [K3cloudController],
    }).compile();

    controller = module.get<K3cloudController>(K3cloudController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
