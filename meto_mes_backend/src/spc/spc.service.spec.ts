import { Test, TestingModule } from '@nestjs/testing';
import { SpcService } from './spc.service';

describe('SpcService', () => {
  let service: SpcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpcService],
    }).compile();

    service = module.get<SpcService>(SpcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
