import { Test, TestingModule } from '@nestjs/testing';
import { InformationInquiryController } from './information-inquiry.controller';

describe('InformationInquiryController', () => {
  let controller: InformationInquiryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InformationInquiryController],
    }).compile();

    controller = module.get<InformationInquiryController>(
      InformationInquiryController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
