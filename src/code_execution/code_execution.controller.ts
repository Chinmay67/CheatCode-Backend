import { Body, Post } from '@nestjs/common';
import { Controller, Get, Req, Res} from '@nestjs/common';
import { CodeExecutionService } from './code_execution.service';

@Controller('code')
export class CodeExecutionController{
    constructor(private ces : CodeExecutionService){}

    @Post('execute')
    async executeCode(@Body() code , @Body() language){
        return await this.ces.executeCode(code , language)
    }
}