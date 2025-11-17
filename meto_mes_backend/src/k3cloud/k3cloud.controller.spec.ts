import { Test, TestingModule } from '@nestjs/testing';
import { K3CloudController } from './k3cloud.controller';

describe('K3CloudController', () => {
  let controller: K3CloudController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [K3CloudController],
    }).compile();

    controller = module.get<K3CloudController>(K3CloudController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
