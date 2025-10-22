import { Test, TestingModule } from '@nestjs/testing';
import { K3cloudService } from './k3cloud.service';

describe('K3cloudService', () => {
  let service: K3cloudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [K3cloudService],
    }).compile();

    service = module.get<K3cloudService>(K3cloudService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
