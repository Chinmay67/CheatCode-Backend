import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient{
    constructor(){
        super({
            datasources : {
                db : {
                    url : 'postgresql://neondb_owner:PQGchwy3X4LU@ep-odd-leaf-a1181nbr-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
                }
            }
        });
    }
}
