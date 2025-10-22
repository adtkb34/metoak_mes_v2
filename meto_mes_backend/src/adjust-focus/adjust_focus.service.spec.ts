import { Test, TestingModule } from '@nestjs/testing';
import { AdjustFocusService } from './adjust_focus.service';

describe('AdjustFocusService', () => {
  let service: AdjustFocusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdjustFocusService],
    }).compile();

    service = module.get<AdjustFocusService>(AdjustFocusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
