import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SerialNumberDataController } from './serial-number-data.controller';
import { SerialNumberDataService } from './serial-number-data.service';

@Module({
  imports: [PrismaModule],
  controllers: [SerialNumberDataController],
  providers: [SerialNumberDataService],
})
export class SerialNumberDataModule {}
