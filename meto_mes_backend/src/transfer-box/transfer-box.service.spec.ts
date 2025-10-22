import { Test, TestingModule } from '@nestjs/testing';
import { TransferBoxService } from './transfer-box.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('TransferBoxService', () => {
  let service: TransferBoxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferBoxService,
        {
          provide: PrismaService,
          useValue: {
            transfer_box: {
              count: jest.fn().mockResolvedValue(0),
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TransferBoxService>(TransferBoxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
