import { Module } from '@nestjs/common';
import { M55hController } from './m55h.controller';
import { M55hService } from './m55h.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [M55hController],
  providers: [M55hService]
})
export class M55hModule {}
