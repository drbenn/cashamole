import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionBody } from '../../../model/transaction.model';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [CommonModule, TableModule, CardModule],
  templateUrl: './transaction-table.component.html',
  styleUrl: './transaction-table.component.scss'
})
export class TransactionTableComponent implements OnInit {
  @Input() tableTitle!: string;
  @Input() tableData!: TransactionBody[];

  ngOnInit(): void {
    console.log('trans table');
    console.log(this.tableTitle);
    console.log(this.tableData);
    
    
    
  }

  protected editTransactionRecord(transaction: TransactionBody) {
    console.log(transaction);
  }

}
