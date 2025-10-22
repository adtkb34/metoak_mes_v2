import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TransferBoxController } from './transfer-box.controller';
import { TransferBoxService } from './transfer-box.service';

@Module({
  imports: [PrismaModule],
  controllers: [TransferBoxController],
  providers: [TransferBoxService],
})
export class TransferBoxModule {}
