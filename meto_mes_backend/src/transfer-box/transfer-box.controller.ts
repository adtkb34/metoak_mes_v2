/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import { TransferBoxService } from './transfer-box.service';
import { CreateTransferBoxDto } from './create-transfer-box.dto';
import { UpdateTransferBoxDto } from './update-transfer-box.dto';

@Controller('transfer-box')
export class TransferBoxController {
  constructor(private readonly service: TransferBoxService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateTransferBoxDto) {
    return this.service.create(dto);
  }

  @Get('batch-no')
  findBatchNo(@Query('boxNos') boxNos: string) {
    return this.service.findBatchNo(boxNos);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTransferBoxDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
