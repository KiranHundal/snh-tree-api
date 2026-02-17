import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateNodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'label must not be blank' })
  label: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
