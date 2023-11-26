import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewTransactionComponent } from './new-transaction/new-transaction.component';
import { Observable } from 'rxjs';
import { TransactionBody } from '../../model/transaction.model';
import { Store } from '@ngxs/store';
import { TransactionTableComponent } from './transaction-table/transaction-table.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, TransactionTableComponent],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit {
  transactions$: Observable<any> = this.store.select((state) => state.user.transactions);
  tableCategories: string[] = [];
  transactionSets: any = {};

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.transactions$.subscribe((entries: TransactionBody[]) => {
      entries.forEach((entry: TransactionBody) => {
        if (!this.tableCategories.includes(entry.category)) {
          this.tableCategories.push(entry.category);
          this.transactionSets[entry.category] = [];
          this.transactionSets[entry.category].push(entry);
        } else {
          this.transactionSets[entry.category].push(entry);
        }
      });
    },
      (error: any )=> console.log(error)
    );
  };

}
