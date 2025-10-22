import { Test, TestingModule } from '@nestjs/testing';
import { TransferBoxController } from './transfer-box.controller';
import { TransferBoxService } from './transfer-box.service';

describe('TransferBoxController', () => {
  let controller: TransferBoxController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferBoxController],
      providers: [TransferBoxService],
    }).compile();

    controller = module.get<TransferBoxController>(TransferBoxController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
