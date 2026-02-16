import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { TreeModule } from './tree/tree.module';

@Module({
  imports: [DatabaseModule, TreeModule],
})
export class AppModule {}
