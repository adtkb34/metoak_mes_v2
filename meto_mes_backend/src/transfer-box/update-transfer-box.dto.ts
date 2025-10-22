import { PartialType } from '@nestjs/mapped-types';
import { CreateTransferBoxDto } from './create-transfer-box.dto';

export class UpdateTransferBoxDto extends PartialType(CreateTransferBoxDto) {}
