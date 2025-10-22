import { Test, TestingModule } from '@nestjs/testing';
import { StereoPrecheckController } from './stereo_precheck.controller';
import { StereoPrecheckService } from './stereo_precheck.service';
import { InformationInquiryService } from 'src/information-inquiry/information-inquiry.service';
import { isS316Shell } from 'src/utils/sn';

jest.mock('src/utils/sn', () => ({
  ...jest.requireActual('src/utils/sn'),
  isS316Shell: jest.fn(),
  SnType: { BEAM: 'BEAM' },
}));

describe('StereoPrecheckController', () => {
  let controller: StereoPrecheckController;
  let service: StereoPrecheckService;
  let tranceService: InformationInquiryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StereoPrecheckController],
      providers: [
        {
          provide: StereoPrecheckService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
            getAll: jest.fn().mockResolvedValue([{ error_code: 0 }]),
            findAllPrecheck: jest.fn().mockResolvedValue({ total: 1, records: [] }),
            findAllOQC: jest.fn().mockResolvedValue({ total: 1, records: [] }),
          },
        },
        {
          provide: InformationInquiryService,
          useValue: {
            getRelatedSerialNumber: jest.fn().mockResolvedValue([{ type: 'BEAM', name: 'beam-sn' }]),
          },
        },
      ],
    }).compile();

    controller = module.get<StereoPrecheckController>(StereoPrecheckController);
    service = module.get<StereoPrecheckService>(StereoPrecheckService);
    tranceService = module.get<InformationInquiryService>(InformationInquiryService);
  });

  it('should create', async () => {
    const res = await controller.create({ sn: '123' } as any);
    expect(service.create).toHaveBeenCalled();
    expect(res.id).toBe(1);
  });

  it('should getData normal sn', async () => {
    (isS316Shell as jest.Mock).mockReturnValue(false);
    const res = await controller.getData('normal-sn');
    expect(service.getAll).toHaveBeenCalled();
    expect(res.error_code).toBe(0); // mo_success
  });

  it('should getData S316 sn and trace', async () => {
    (isS316Shell as jest.Mock).mockReturnValue(true);
    const res = await controller.getData('S316-sn');
    expect(tranceService.getRelatedSerialNumber).toHaveBeenCalled();
    expect(service.getAll).toHaveBeenCalledWith('beam-sn');
  });

  it('should return fail when sn is empty', async () => {
    const res = await controller.getData('');
    expect(res.error_code).toBe(-1);
  });

  it('should findAll with isPrecheck=1', async () => {
    const res = await controller.findAll('2025-01-01', '2025-01-02', '1', '10', '1');
    expect(service.findAllPrecheck).toHaveBeenCalled();
  });

  it('should findAll with isPrecheck=0', async () => {
    const res = await controller.findAll('2025-01-01', '2025-01-02', '1', '10', '0');
    expect(service.findAllOQC).toHaveBeenCalled();
  });
});