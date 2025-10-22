import { Test, TestingModule } from '@nestjs/testing';
import { BasicInformationController } from './basic-information.controller';

describe('BasicInformationController', () => {
  let controller: BasicInformationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BasicInformationController],
    }).compile();

    controller = module.get<BasicInformationController>(
      BasicInformationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
