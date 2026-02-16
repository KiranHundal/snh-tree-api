import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNodeDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
