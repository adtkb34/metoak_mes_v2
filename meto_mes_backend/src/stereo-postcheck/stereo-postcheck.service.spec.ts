import { Test, TestingModule } from '@nestjs/testing';
import { StereoPostcheckService } from './stereo-postcheck.service';

describe('StereoPostcheckService', () => {
  let service: StereoPostcheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StereoPostcheckService],
    }).compile();

    service = module.get<StereoPostcheckService>(StereoPostcheckService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
