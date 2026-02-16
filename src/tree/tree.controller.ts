import { Controller, Get, Post, Body } from '@nestjs/common';
import { TreeService } from './tree.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { TreeNode } from './interface/tree-node.interface';

@Controller('tree')
export class TreeController {
  constructor(private readonly treeService: TreeService) {}

  @Get()
  findAll(): Promise<TreeNode[]> {
    return Promise.resolve(this.treeService.findAll());
  }

  @Post()
  create(@Body() createNodeDto: CreateNodeDto): Promise<TreeNode> {
    return Promise.resolve(this.treeService.create(createNodeDto));
  }
}
