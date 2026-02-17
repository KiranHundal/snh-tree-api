import { Controller, Get, Post, Body } from '@nestjs/common';
import { TreeService } from './tree.service';
import { CreateNodeDto } from './dto/create-node.dto';
import type { TreeNode } from './interface/tree-node.interface';

@Controller('tree')
export class TreeController {
  constructor(private readonly treeService: TreeService) {}

  @Get()
  findAll(): TreeNode[] {
    return this.treeService.findAll();
  }

  @Post()
  create(@Body() createNodeDto: CreateNodeDto): TreeNode {
    return this.treeService.create(createNodeDto);
  }
}
