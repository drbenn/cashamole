import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { DashboardStateModel } from '../../store/dashboard/dashboard.state';

@Component({
  selector: 'app-month-net-cash-flow-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './month-net-cash-flow-banner.component.html',
  styleUrl: './month-net-cash-flow-banner.component.scss'
})
export class MonthNetCashFlowBannerComponent implements OnInit {
  protected dashboardData$: Observable<any> = this.store.select((state: any) => state.dashboard);
  protected monthIncome: number = 0;
  protected monthExpense: number = 0;
  protected monthNetCashflow: number = 0;

  constructor(private store: Store) {}

  ngOnInit(): void {
      this.dashboardData$.subscribe((data: DashboardStateModel) => {
        this.monthIncome = data.monthIncome;
        this.monthExpense = data.monthExpenses;
        this.monthNetCashflow = data.monthNetCashFlow;
      })
  }
}
