import { Test, TestingModule } from '@nestjs/testing';
import { InformationInquiryService } from './information-inquiry.service';

describe('InformationInquiryService', () => {
  let service: InformationInquiryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InformationInquiryService],
    }).compile();

    service = module.get<InformationInquiryService>(InformationInquiryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
