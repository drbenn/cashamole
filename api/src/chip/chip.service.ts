import { Injectable } from '@nestjs/common';
import { ChipDto } from './chip-dto/chip-dto';
import { InjectClient } from 'nest-mysql';
import { Connection } from 'mysql2';

@Injectable()
export class ChipService {

    constructor(@InjectClient() private readonly connection: Connection) {}

    async createNewChip(chipDto: ChipDto, userId: number): Promise<ChipDto | 'insert error' | 'undefined userid' > {
        if (!userId) {
            return 'undefined userid';
        };

        const isChipExist: boolean = await this.checkForExistingChip(chipDto.kind, chipDto.chip, userId);
        
        if (!isChipExist) {
            const sqlQuery: string = `INSERT IGNORE INTO user${userId}_chips (kind, chip, status) 
                VALUES (
                    \'${chipDto.kind}\', 
                    \'${chipDto.chip}\', 
                    \'${chipDto.status}\'
                )`;
            const newChip = await this.connection.query(sqlQuery);
            const results = Object.assign([{}], newChip[0]);
            if (results.affectedRows === 1) {
                const completeChip: ChipDto = chipDto;
                completeChip.id = results.insertId;
                return completeChip;
            } else {
                return 'insert error';
            };
        } else {
            return 'insert error';
        };
    };

    async checkForExistingChip(kind: string, chip: string, userId: number): Promise<boolean> {
        const sqlQuery: string = `
        SELECT * FROM user${userId}_chips WHERE kind = '${kind}' AND chip = '${chip}';`
        const chipCheck = await this.connection.query(sqlQuery);
        const results = Object.assign([{}], chipCheck[0]);
        if (results[0].id) {   
            return true;
        } else {
            return false;
        };
    };
    

    async deleteChip(chipDto: ChipDto, userId: number): Promise<'delete successful' | 'delete error' | 'undefined userid' > {
        if (!userId) {
            return 'undefined userid';
        };
        const sqlQuery: string = `DELETE FROM user${userId}_chips WHERE chip = '${chipDto.chip}' AND kind = '${chipDto.kind}';`
        const deletedChip = await this.connection.query(sqlQuery);
        const results = Object.assign([{}], deletedChip[0]);
        if (results.serverStatus === 34) {
            return 'delete successful';
        } else {
            return 'delete error';
        };
    };
}
