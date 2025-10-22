import { Test, TestingModule } from '@nestjs/testing';
import { StereoPrecheckService } from './stereo_precheck.service';

describe('StereoPrecheckService', () => {
  let service: StereoPrecheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StereoPrecheckService],
    }).compile();

    service = module.get<StereoPrecheckService>(StereoPrecheckService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
