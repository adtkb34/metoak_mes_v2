import { Module } from '@nestjs/common';
import { ImuCalibService } from './imu.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ImuController } from './imu.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ImuController],
  exports: [ImuCalibService],
  providers: [ImuCalibService]
})
export class ImuModule {}
