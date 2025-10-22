import { Module } from '@nestjs/common';
import { AdjustFocusController } from './adjust_focus.controller';
import { AdjustFocusService } from './adjust_focus.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdjustFocusController],
  providers: [AdjustFocusService]
})
export class AdjustFocusModule {}
