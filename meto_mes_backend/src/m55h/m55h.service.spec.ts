import { Test, TestingModule } from '@nestjs/testing';
import { M55hService } from './m55h.service';

describe('M55hService', () => {
  let service: M55hService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [M55hService],
    }).compile();

    service = module.get<M55hService>(M55hService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
