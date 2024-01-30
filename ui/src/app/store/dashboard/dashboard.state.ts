import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { CoreApiService } from '../../api-services/core-api.service';
import { DashboardActions } from './dashboard.actions';
import { BalanceSheetEntry, DashboardHistoryBalance, DashboardHistoryExpense, DashboardHistoryIncome, DashboardHistoryInvestment, DashboardHistoryNetWorth } from '../../models/core.model';




export interface DashboardStateModel {
    monthExpenses: number,
    monthIncome: number,
    monthInvest: number,
    monthPreTaxInvest: number,
    monthPostTaxInvest: number,
    monthNetCashFlow: number,
    monthAssets: number,
    monthLiabilities: number,
    monthNetWorth: number,
    expenseHistoryByMonth: DashboardHistoryExpense[],
    incomeHistoryByMonth: DashboardHistoryIncome[],
    investHistoryByMonth: DashboardHistoryInvestment[],
    balanceHistoryByMonth: DashboardHistoryBalance[],
    yearOptions: string[],
    yearMonthOptions: string[],

    activeAnnualYear: string,
    activeMonthlyYear: string,
    activeMonthlyMonth: string,

    userSelectedView: 'monthly' | 'annual' | 'all-time',
    activeViewExpenses: DashboardHistoryExpense[],
    activeViewIncome: DashboardHistoryIncome[],
    activeViewInvestments: DashboardHistoryInvestment[],
    activeViewAssets: DashboardHistoryBalance[],
    activeViewLiabilities: DashboardHistoryBalance[],
    activeViewNetWorth: any[]
}

@State<DashboardStateModel>({
  name: 'dashboard',
  defaults: {
    monthExpenses: 0,
    monthIncome: 0,
    monthInvest: 0,
    monthPreTaxInvest: 0,
    monthPostTaxInvest: 0,
    monthNetCashFlow: 0,
    monthAssets: 0,
    monthLiabilities: 0,
    monthNetWorth: 0,
    expenseHistoryByMonth: [],
    incomeHistoryByMonth: [],
    investHistoryByMonth: [],
    balanceHistoryByMonth: [],
    yearOptions:[],
    yearMonthOptions: [],

    activeAnnualYear: '',
    activeMonthlyYear: '',
    activeMonthlyMonth: '',

    userSelectedView: 'all-time',
    activeViewExpenses: [],
    activeViewIncome: [],
    activeViewInvestments: [],
    activeViewAssets: [],
    activeViewLiabilities: [],
    activeViewNetWorth: []
    },
  }
)
@Injectable()
export class DashboardState {
  constructor(
    private store: Store,
    private router: Router,
    private coreApi: CoreApiService
    ) {}

  @Selector() 
  static yearOptions(state: DashboardStateModel): string[] {
    return state.yearOptions;
  };

  @Selector() 
  static activeYearMonthOptions(state: DashboardStateModel): string[] {
    const monthlabelOptions: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsUsedInActiveYearSet: Set<any> = state.balanceHistoryByMonth
      .filter((balance: DashboardHistoryBalance) => balance.type === 'asset' && balance.unique_date.slice(0, 4) === state.activeAnnualYear)
      .map((balance: DashboardHistoryBalance) => {
        return { month: balance.unique_date.slice(5, 7)}
      })
      .reduce((uniqueSet, obj) => {
        uniqueSet.add(obj.month);
        return uniqueSet;
      }, new Set());
      
      // TODO: If active year ensure only up to current month is available
      let monthsUsedInActiveYearArray: string[] = Array.from(monthsUsedInActiveYearSet);
      const today = new Date();
      const todayMonth: string = today.toLocaleDateString('en-US', { month: '2-digit' });
      const todayFullYear: string = today.getFullYear().toString();
      if (state.activeAnnualYear === todayFullYear) {
        const shortenedMonthsUsedInActiveYearArray: string[] = [];
        monthsUsedInActiveYearArray.forEach((month: string) => parseInt(month) <= parseInt(todayMonth) ? shortenedMonthsUsedInActiveYearArray.push(month): null);
        monthsUsedInActiveYearArray = shortenedMonthsUsedInActiveYearArray; 
      };
      const activeYearMonthOptions: string[] = [];
      monthsUsedInActiveYearArray.forEach((monthNum: string) => activeYearMonthOptions.push(monthlabelOptions[parseInt(monthNum) - 1]));

    return activeYearMonthOptions;  
  };

  @Selector() 
  static selectedDashboardView(state: DashboardStateModel): string {
    return state.userSelectedView;
  };

  @Selector() 
  static expenseCompositionChartData(state: DashboardStateModel): { userView: string, data: DashboardHistoryExpense[] } {
    return {
      userView: state.userSelectedView,
      data: state.activeViewExpenses
    };
  };

  @Selector() 
  static assetCompositionChartData(state: DashboardStateModel): { userView: string, data: DashboardHistoryBalance[] } {
    return {
      userView: state.userSelectedView,
      data: state.activeViewAssets
    };
  };

  @Selector() 
  static liabilityCompositionChartData(state: DashboardStateModel): { userView: string, data: DashboardHistoryBalance[] } {
    return {
      userView: state.userSelectedView,
      data: state.activeViewLiabilities
    };
  };

  @Selector() 
  static incomeHistoryChartData(state: DashboardStateModel): { userView: string, data: DashboardHistoryIncome[] } {    
    return {
      userView: state.userSelectedView,
      data: state.activeViewIncome
    };
  };

  @Selector() 
  static expenseHistoryChartData(state: DashboardStateModel): { userView: string, data: DashboardHistoryExpense[] } {
    return {
      userView: state.userSelectedView,
      data: state.activeViewExpenses
    };
  };

  @Selector() 
  static netWorthHistoryChartData(state: DashboardStateModel): { userView: string, data: DashboardHistoryNetWorth[] } {
    return {
      userView: state.userSelectedView,
      data: state.activeViewNetWorth
    };
  };

  @Selector() 
  static assetVsLiabilityHistoryChartData(state: DashboardStateModel): { userView: string, assetData: DashboardHistoryBalance[], liabilityData: DashboardHistoryBalance[] } {
    return {
      userView: state.userSelectedView,
      assetData: state.activeViewAssets,
      liabilityData: state.activeViewLiabilities
    };
  };

  @Action(DashboardActions.SetDashboardHistoryOnLogin)
  setDashboardHistoryOnLogin(
  ctx: StateContext<DashboardStateModel>,
  action: DashboardActions.SetDashboardHistoryOnLogin
  ) {
    // get unique years for filter
    const yearOptions: string[] = Array.from(
      new Set(
        action.payload.balances.map((balance: DashboardHistoryBalance) => balance.unique_date.slice(0, 4))
      )
    );
    yearOptions.sort((a, b) => b.toLowerCase().localeCompare(a.toLowerCase()));
    
    ctx.patchState({ 
      expenseHistoryByMonth: action.payload.expenses,
      incomeHistoryByMonth: action.payload.income,
      investHistoryByMonth: action.payload.investments,
      balanceHistoryByMonth: action.payload.balances,
      yearOptions: yearOptions,
    });
  };


  @Action(DashboardActions.SetActiveAnnualYearForDashboard)
  setActiveAnnualYearForDashboard(
    ctx: StateContext<DashboardStateModel>,
    action: DashboardActions.SetActiveAnnualYearForDashboard
  ) {
    ctx.patchState({ 
      activeAnnualYear: action.payload,
    });
  };

  @Action(DashboardActions.SetActiveMonthlyYearForDashboard)
  setActiveMonthlyYearForDashboard(
    ctx: StateContext<DashboardStateModel>,
    action: DashboardActions.SetActiveMonthlyYearForDashboard
  ) {
    ctx.patchState({ 
      activeMonthlyYear: action.payload,
    });
  };

  @Action(DashboardActions.SetActiveMonthlyMonthForDashboard)
  setActiveMonthlyMonthForDashboard(
    ctx: StateContext<DashboardStateModel>,
    action: DashboardActions.SetActiveMonthlyMonthForDashboard
  ) {
    ctx.patchState({ 
      activeMonthlyMonth: action.payload,
    });
  };

  @Action(DashboardActions.FilterDataForSelectedTimePeriodView)
  filterDataForSelectedTimePeriodView(
    ctx: StateContext<DashboardStateModel>,
    action: DashboardActions.FilterDataForSelectedTimePeriodView
  ) {
    const activeView: 'monthly' | 'annual' | 'all-time' | null = action.payload.type;
    const activeYear: string = action.payload.year === null ? '' : action.payload.year.toString();
    const activeMonth: string = action.payload.month === null ? '' : action.payload.month.toString();

    // limit data to nothing after the current month of today
    const today: Date = new Date();
    const months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Nov', 'Dec'];
    const monthStrings: string[] = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const todayFullYear: string = today.getFullYear().toString();
    const todayShortMonth: string = today.toLocaleDateString('en-US', { month: 'short' });
    const currentMonthIndex: number = (months.findIndex((month: string) => month === todayShortMonth));
    const currentYearLimitedMonths: string[] = months.slice(0,currentMonthIndex + 1);
    const currentYearLimitedMonthsDigits: string[] = [];
    currentYearLimitedMonths.forEach((_month: string) => {
      const matchingMonth: string = monthStrings[(months.findIndex((month: string) => month === _month))];
      currentYearLimitedMonthsDigits.push(matchingMonth);
    })

    // console.log(currentYearLimitedMonths);
    
    // All values for base filters
    const expenseHistory: DashboardHistoryExpense[] = ctx.getState().expenseHistoryByMonth;
    const incomeHistory: DashboardHistoryIncome[] = ctx.getState().incomeHistoryByMonth;
    const investHistory: DashboardHistoryInvestment[] = ctx.getState().investHistoryByMonth;
    const balanceHistory: DashboardHistoryBalance[] = ctx.getState().balanceHistoryByMonth;
    
    if (activeView === 'all-time') {
      const allTimeExpenses: DashboardHistoryExpense[] = expenseHistory.filter((item: DashboardHistoryExpense) => {
        return this.allTimeValidationFilter(todayFullYear, currentYearLimitedMonthsDigits, item);
      });
      const allTimeIncome: DashboardHistoryIncome[] = incomeHistory.filter((item: DashboardHistoryIncome) => {
        return this.allTimeValidationFilter(todayFullYear, currentYearLimitedMonthsDigits, item);
      });
      const allTimeInvest: DashboardHistoryInvestment[] = investHistory.filter((item: DashboardHistoryInvestment) => {
        return this.allTimeValidationFilter(todayFullYear, currentYearLimitedMonthsDigits, item);
      });
      const allTimeAssets: DashboardHistoryBalance[] = balanceHistory.filter((item: DashboardHistoryBalance) => {
        return this.allTimeValidationFilter(todayFullYear, currentYearLimitedMonthsDigits, item);
      }).filter((_item: DashboardHistoryBalance) => _item.type === 'asset');
      const allTimeLiabilies: DashboardHistoryBalance[] = balanceHistory.filter((item: DashboardHistoryBalance) => {
        return this.allTimeValidationFilter(todayFullYear, currentYearLimitedMonthsDigits, item);
      }).filter((_item: DashboardHistoryBalance) => _item.type === 'liability');
      const allTimeNetWorth: DashboardHistoryNetWorth[] = this.generateAllTimeNetWorthData(allTimeAssets,allTimeLiabilies);
      
      ctx.patchState({
        userSelectedView: 'all-time',
        activeViewExpenses: allTimeExpenses,
        activeViewIncome: allTimeIncome,
        activeViewInvestments: allTimeInvest,
        activeViewAssets: allTimeAssets,
        activeViewLiabilities: allTimeLiabilies,
        activeViewNetWorth: allTimeNetWorth
      });
    };

    // activeView annual is also called and accounts for Y-T-D view selection
    if (activeView === 'annual') {
      const annualExpenses: DashboardHistoryExpense[] = expenseHistory.filter((item: DashboardHistoryExpense) => {
        return this.annualYearValidationFilter(activeYear, todayFullYear, currentYearLimitedMonthsDigits, item);
      });
      const annualIncome: DashboardHistoryIncome[] = incomeHistory.filter((item: DashboardHistoryIncome) => {
        return this.annualYearValidationFilter(activeYear, todayFullYear, currentYearLimitedMonthsDigits, item);
      });
      const annualInvest: DashboardHistoryInvestment[] = investHistory.filter((item: DashboardHistoryInvestment) => {
        return this.annualYearValidationFilter(activeYear, todayFullYear, currentYearLimitedMonthsDigits, item);
      });
      const annualAssets: DashboardHistoryBalance[] = balanceHistory.filter((item: DashboardHistoryBalance) => {
        return this.annualYearValidationFilter(activeYear, todayFullYear, currentYearLimitedMonthsDigits, item);
      }).filter((_item: DashboardHistoryBalance) => _item.type === 'asset');
      const annualLiabilies: DashboardHistoryBalance[] = balanceHistory.filter((item: DashboardHistoryBalance) => {
        return this.annualYearValidationFilter(activeYear, todayFullYear, currentYearLimitedMonthsDigits, item);
      }).filter((_item: DashboardHistoryBalance) => _item.type === 'liability');
      const annualNetWorth: DashboardHistoryNetWorth[] = this.generateOneYearNetWorthData(annualAssets,annualLiabilies);
      
      ctx.patchState({
        userSelectedView: 'annual',
        activeViewExpenses: annualExpenses,
        activeViewIncome: annualIncome,
        activeViewInvestments: annualInvest,
        activeViewAssets: annualAssets,
        activeViewLiabilities: annualLiabilies,
        activeViewNetWorth: annualNetWorth
      });
    };

    if (activeView === 'monthly') {      
      const monthlyExpenses: DashboardHistoryExpense[] = expenseHistory.filter((item: DashboardHistoryExpense) => {
        return this.monthlyValidationFilter(activeMonth, activeYear, item);
      });
      const monthlyIncome: DashboardHistoryIncome[] = incomeHistory.filter((item: DashboardHistoryIncome) => {
        return this.monthlyValidationFilter(activeMonth, activeYear, item);
      });
      const monthlyInvest: DashboardHistoryInvestment[] = investHistory.filter((item: DashboardHistoryInvestment) => {
        return this.monthlyValidationFilter(activeMonth, activeYear, item);
      });
      const monthlyAssets: DashboardHistoryBalance[] = balanceHistory.filter((item: DashboardHistoryBalance) => {
        return this.monthlyValidationFilter(activeMonth, activeYear, item);
      }).filter((_item: DashboardHistoryBalance) => _item.type === 'asset');
      const monthlyLiabilities: DashboardHistoryBalance[] = balanceHistory.filter((item: DashboardHistoryBalance) => {
        return this.monthlyValidationFilter(activeMonth, activeYear, item);
      }).filter((_item: DashboardHistoryBalance) => _item.type === 'liability');
      const monthlyNetWorth: DashboardHistoryNetWorth[] = this.generateMonthlyNetWorthData(monthlyAssets,monthlyLiabilities);
      
      ctx.patchState({
        userSelectedView: 'monthly',
        activeViewExpenses: monthlyExpenses,
        activeViewIncome: monthlyIncome,
        activeViewInvestments: monthlyInvest,
        activeViewAssets: monthlyAssets,
        activeViewLiabilities: monthlyLiabilities,
        activeViewNetWorth: monthlyNetWorth
      });
    };
  };


  private allTimeValidationFilter(
    todayFullYear: string,
    currentYearLimitedMonthsDigits: string[],
    item: DashboardHistoryExpense | DashboardHistoryIncome | DashboardHistoryInvestment | DashboardHistoryBalance
    ): boolean {
    const itemYear: string = item.unique_date.slice(0, 4);
    const itemMonth: string = item.unique_date.slice(5,8);
    const isItemCurrentYear: boolean = itemYear === todayFullYear;
    const isMonthInCurrentYearLimitedMonths: boolean = currentYearLimitedMonthsDigits.includes(itemMonth);
    return !isItemCurrentYear || isItemCurrentYear && isMonthInCurrentYearLimitedMonths;
  };

  private annualYearValidationFilter(
    activeYear: string,
    todayFullYear: string,
    currentYearLimitedMonthsDigits: string[],
    item: DashboardHistoryExpense | DashboardHistoryIncome | DashboardHistoryInvestment | DashboardHistoryBalance
    ): boolean {
    const itemYear: string = item.unique_date.slice(0, 4);
    const itemMonth: string = item.unique_date.slice(5,8);
    const isSelectedYearCurrentYear: boolean = activeYear === todayFullYear;
    const isItemActiveYear: boolean = itemYear === activeYear;
    const isMonthInCurrentYearLimitedMonths: boolean = currentYearLimitedMonthsDigits.includes(itemMonth);
    if (!isSelectedYearCurrentYear) {
      return itemYear === activeYear;
    } else {
      return isItemActiveYear && isMonthInCurrentYearLimitedMonths
    };
  };

  /**
   * 
   * @param activeMonth 'Jan' or 'Feb' etc...
   * @param activeYear '2022' or '2023' etc...
   * @param item 
   * @returns 
   */
  private monthlyValidationFilter(
    activeMonth: string,
    activeYear: string,
    item: DashboardHistoryExpense | DashboardHistoryIncome | DashboardHistoryInvestment | DashboardHistoryBalance | any
    ): boolean {
    const itemYear: string = item.unique_date.slice(0, 4);
    const itemMonth: string = item.unique_date.slice(5,8);
    const months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const itemMonthAsShortMonth: string = months[parseInt(itemMonth) - 1];    
    return itemYear == activeYear && itemMonthAsShortMonth == activeMonth;
  };

  /**
   * Chart data to display progress for single month, One data object in array
   * @param annualAssets 
   * @param annualLiabilities 
   * @returns DashboardHistoryNetWorth[]
   */
  private generateMonthlyNetWorthData(
    monthlyAssets: DashboardHistoryBalance[],
    monthlyLiabilities: DashboardHistoryBalance[]
    ): DashboardHistoryNetWorth[] {
    let netWorthTotal: number = 0;
    let monthNetWorth: DashboardHistoryNetWorth = {
      unique_date: '',
      net_worth: ''
    };
    monthlyAssets.forEach((item: DashboardHistoryBalance) => netWorthTotal += parseFloat(item.total_balance));
    monthlyLiabilities.forEach((item: DashboardHistoryBalance) => netWorthTotal -= parseFloat(item.total_balance));
    monthNetWorth.unique_date = monthlyAssets[0].unique_date;
    monthNetWorth.net_worth = netWorthTotal.toString();

    const netWorth: DashboardHistoryNetWorth[] = [monthNetWorth];
    return netWorth;
  };

  /**
   * Chart data to display progress by Month for selected year
   * @param annualAssets 
   * @param annualLiabilities 
   * @returns DashboardHistoryNetWorth[]
   */
  private generateOneYearNetWorthData(
    annualAssets: DashboardHistoryBalance[],
    annualLiabilities: DashboardHistoryBalance[]
    ): DashboardHistoryNetWorth[] {
    const netWorthArray: DashboardHistoryNetWorth[] = [];
    // find/list available months for year
    const uniqueDates: string[] = Array.from(
      new Set(
        annualAssets.map((item: DashboardHistoryBalance) => item.unique_date)
    ));
    uniqueDates.sort();
    const xYearMonthData: number[] = new Array(uniqueDates.length).fill(0);

    annualAssets.forEach((item: DashboardHistoryBalance) => {
      const indexFromAvailableMonths: number = uniqueDates.findIndex((year_month: string) => item.unique_date === year_month);
      xYearMonthData[indexFromAvailableMonths] += parseFloat(item.total_balance);
    });
    annualLiabilities.forEach((item: DashboardHistoryBalance) => {
      const indexFromAvailableMonths: number = uniqueDates.findIndex((year_month: string) => item.unique_date === year_month);
      xYearMonthData[indexFromAvailableMonths] -= parseFloat(item.total_balance);
    });

    uniqueDates.forEach((uniqueDate: string, index: number) => {
      let monthNetWorth: DashboardHistoryNetWorth = {
        unique_date: uniqueDate,
        net_worth: xYearMonthData[index].toString()
      };
      netWorthArray.push(monthNetWorth);
    });
    return netWorthArray;
  };

  /**
   * Chart data to display progress by year
   * - each year designated by start date of year Jan 1, balance sheet data
   * - start and end dates are based on user data, to expand from when user first started to input data, until the current month
   * @param annualAssets 
   * @param annualLiabilities 
   * @returns DashboardHistoryNetWorth[]
   */
  private generateAllTimeNetWorthData(
    annualAssets: DashboardHistoryBalance[],
    annualLiabilities: DashboardHistoryBalance[]
    ): DashboardHistoryNetWorth[] {
    // 1. Take all asset/liability data and calculate networth for each month
    const allNetWorthByMonthAndYear: DashboardHistoryNetWorth[] =  this.generateOneYearNetWorthData(annualAssets, annualLiabilities);
    // 2. Find Unique Years from data range
    const uniqueYears: string[] = Array.from(
      new Set(
        allNetWorthByMonthAndYear.map((item: DashboardHistoryNetWorth) => item.unique_date.slice(0, 4))
    ));
    uniqueYears.sort();
    // 3. Find first month instance of unique year(hopefully all Jan_20XX)
    const labelDates: string[] = [];
    uniqueYears.forEach((year: string) => {
      let firstMonthoOfUniqueYear = allNetWorthByMonthAndYear.find((item: DashboardHistoryNetWorth) => item.unique_date.slice(0, 4) === year);
      if (firstMonthoOfUniqueYear) {
        labelDates.push(firstMonthoOfUniqueYear.unique_date)
      };
    })
    // 4. Add start/end dates to data (if user started recording data before Jan of first year, and up to current date)
    if (labelDates[0] !== allNetWorthByMonthAndYear[0].unique_date) {
      labelDates.unshift(allNetWorthByMonthAndYear[0].unique_date)
    };
    if (labelDates[labelDates.length - 1] !== allNetWorthByMonthAndYear[allNetWorthByMonthAndYear.length - 1].unique_date) {
      labelDates.push(allNetWorthByMonthAndYear[allNetWorthByMonthAndYear.length - 1].unique_date);
    };
    // 5. Create array of net worth data from only specific unique_date labelDates for displaying chart data at appropriate intervals
    const allTimeIntervaledNetWorthData: DashboardHistoryNetWorth[] = [];
    labelDates.forEach((date: string) => {
      const netWorthAtInterval = allNetWorthByMonthAndYear.find((item: DashboardHistoryNetWorth) => item.unique_date === date);
      if (netWorthAtInterval) {
        allTimeIntervaledNetWorthData.push(netWorthAtInterval);
      };
    });

    return allTimeIntervaledNetWorthData;
  };
}

