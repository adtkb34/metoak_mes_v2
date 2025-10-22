import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
