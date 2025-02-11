import { Module } from "@nestjs/common";
import { CodeExecutionService } from "./code_execution.service";
import { CodeExecutionController } from "./code_execution.controller";

@Module({
    providers : [CodeExecutionService] ,
    exports : [] , 
    controllers : [CodeExecutionController]
})

export class CodeExecutionModule {}