import { Module } from '@nestjs/common';
import { StereoPostcheckController } from './stereo-postcheck.controller';
import { StereoPostcheckService } from './stereo-postcheck.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StereoPostcheckController],
  providers: [StereoPostcheckService]
})
export class StereoPostcheckModule {}
