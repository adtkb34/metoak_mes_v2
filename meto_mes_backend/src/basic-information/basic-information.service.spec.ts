import { Test, TestingModule } from '@nestjs/testing';
import { BasicInformationService } from './basic-information.service';

describe('BasicInformationService', () => {
  let service: BasicInformationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BasicInformationService],
    }).compile();

    service = module.get<BasicInformationService>(BasicInformationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
