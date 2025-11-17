import { Test, TestingModule } from '@nestjs/testing';
import { K3CloudService } from './k3cloud.service';

describe('K3CloudService', () => {
  let service: K3CloudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [K3CloudService],
    }).compile();

    service = module.get<K3CloudService>(K3CloudService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
