import { Component, OnInit } from '@angular/core';
import { DashboardState } from '../../store/dashboard/dashboard.state';
import { CardModule } from 'primeng/card';
import { Observable } from 'rxjs';
import { Select } from '@ngxs/store';
import { ChartModule } from 'primeng/chart';
import { DashboardHistoryBalance } from '../../models/core.model';
import { DashboardService } from '../dashboard.service';
import { ChartJsDataInputs } from '../../models/dashboard.models';

@Component({
  selector: 'app-liability-composition',
  standalone: true,
  imports: [CardModule, ChartModule],
  templateUrl: './liability-composition.component.html',
  styleUrl: './liability-composition.component.scss'
})
export class LiabilityCompositionComponent implements OnInit {
  @Select(DashboardState.liabilityCompositionChartData) data$!: Observable<{ userView: string, data: DashboardHistoryBalance[]}>;
  protected chartData: any;
  protected chartOptions: any;

  constructor(
    private dashboardService: DashboardService
  ) {};

  ngOnInit(): void {
    this.data$.subscribe((data: { userView: string, data: DashboardHistoryBalance[]}) => {
      if (data) {
        if (data.userView === 'annual') {
          // filter data to last month of annual data
          const lastMonth: string = data.data[data.data.length - 1].unique_date.slice(5, 7);
          const lastMonthData: DashboardHistoryBalance[] = data.data.filter((item: DashboardHistoryBalance) => item.unique_date.slice(5, 7) === lastMonth);
          const chartData: ChartJsDataInputs  = this.configureBalanceDataInputsIntoCategories(lastMonthData);
          this.updateChart(chartData);
        } else if (data.userView === 'monthly') {
          const chartData: ChartJsDataInputs  = this.configureBalanceDataInputsIntoCategories(data.data);
          this.updateChart(chartData);
        };
      };
    });
  };

  private updateChart(data: ChartJsDataInputs) {
    this.chartData = {
      labels: data.labels,
      datasets: [
        {
          data: data.chartDataSet,
          backgroundColor: data.backgroundColors,
          borderColor: data.borderColors,
          borderWidth: 1,
          hoverBackgroundColor: data.borderColors     
        }
      ]
    };

    this.chartOptions = {
      plugins: {
        legend: {
            position: 'left',
            labels: {
                color: '#00000090',
                position: 'left'
            }
        }
      }
    };
  };

  private configureBalanceDataInputsIntoCategories(data: DashboardHistoryBalance[]) {
    // get unique categories
    const categories: string[] = Array.from(
      new Set(
        data.map((item: DashboardHistoryBalance) => item.description)
    ));
    categories.sort();

    // get colors
    const backgroundColors: string[] = this.dashboardService.chartTransparentColors(categories.length);
    const borderColors: string[] = this.dashboardService.chartOpaqueColors(categories.length);

    // get data
    const categoryData: number[] = new Array(categories.length).fill(0);
    data.forEach((item: DashboardHistoryBalance) => {
      const categoryIndex: number = categories.findIndex((category: string) => category === item.description);
      categoryData[categoryIndex] += parseFloat(item.total_balance);
    });

    return {
      chartDataSet: categoryData,
      labels: categories,
      backgroundColors: backgroundColors,
      borderColors: borderColors
    };
  };

}
