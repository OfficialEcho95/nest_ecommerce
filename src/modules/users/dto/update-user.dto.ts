import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '../../auth/dto/create-dto.users';

export class UpdateUserDto extends PartialType(CreateUserDto) {}


