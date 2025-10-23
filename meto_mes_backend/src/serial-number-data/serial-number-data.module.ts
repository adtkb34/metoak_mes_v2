import { Module } from '@nestjs/common';
import { SerialNumberDataController } from './serial-number-data.controller';
import { SerialNumberDataService } from './serial-number-data.service';

@Module({
  controllers: [SerialNumberDataController],
  providers: [SerialNumberDataService],
})
export class SerialNumberDataModule {}
