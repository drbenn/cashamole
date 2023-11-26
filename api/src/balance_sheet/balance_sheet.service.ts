import { Injectable } from '@nestjs/common';
import { Connection } from 'mysql2';
import { InjectClient } from 'nest-mysql';
import { BalanceRecordDto } from './balance_sheet-dto/balance_sheet-dto';
import { ChipService } from 'src/chip/chip.service';
import { ChipDto } from 'src/chip/chip-dto/chip-dto';

@Injectable()
export class BalanceSheetService {
    
    constructor(
        @InjectClient() private readonly connection: Connection,
        private chipService: ChipService
        ) {}

    async postNewBalanceRecord(balanceRecordDto: BalanceRecordDto, userId: number): Promise<BalanceRecordDto | 'insert error' | 'undefined userid' > {
        if (!userId) {
            return 'undefined userid';
        };
        const chip: ChipDto = {kind: balanceRecordDto.type, chip: balanceRecordDto.description, status: 'active'};
        this.chipService.createNewChip(chip, userId);
        const sqlQuery: string = `INSERT INTO user${userId}_bal_sheet (date, amount, type, description, status) 
            VALUES (
                \'${balanceRecordDto.date}\', 
                \'${balanceRecordDto.amount}\', 
                \'${balanceRecordDto.type}\',
                \'${balanceRecordDto.description}\',
                \'${balanceRecordDto.status}\'
            )`;
        const newBalanceRecord = await this.connection.query(sqlQuery);
        const results = Object.assign([{}], newBalanceRecord[0]);
        if (results.affectedRows === 1) {
            const completeBalanceRecord: BalanceRecordDto = balanceRecordDto;
            completeBalanceRecord.record_id = results.insertId;
            return completeBalanceRecord;
        } else {
            return 'insert error';
        };
    };

}
