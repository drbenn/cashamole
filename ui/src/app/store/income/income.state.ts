import { Injectable } from '@angular/core';
import { Action, State, StateContext, Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { IncomeActions } from '../income/income.actions';
import { Income } from '../../model/core.model';
import { CoreApiService } from '../../shared/api/core-api.service';


export interface IncomeStateModel {
    income: Income[]
}

@State<IncomeStateModel>({
  name: 'income',
  defaults: {
        income: []
    },
  }
)
@Injectable()
export class IncomeState {
  constructor(
    private store: Store,
    private router: Router,
    private coreApi: CoreApiService
    ) {}


  @Action(IncomeActions.SetIncomeOnLogin)
  setIncomeOnLogin(
    ctx: StateContext<IncomeStateModel>,
    action: IncomeActions.SetIncomeOnLogin
  ) {
    ctx.patchState({ 
      income: action.payload
    });
  };

  @Action(IncomeActions.GetAndSetMonthIncomeRecords)
  getAndSetMonthIncomeRecords(
    ctx: StateContext<IncomeStateModel>,
    action: IncomeActions.GetAndSetMonthIncomeRecords
  ) {
    this.coreApi.getActiveIncomeRecordsByMonth(action.payload).subscribe((res: any) => {
      if (res.data === 'null') {
        ctx.patchState({ 
          income: []
        });
      } else {
        ctx.patchState({ 
          income: JSON.parse(res.data)
        });
      };
    });
  };

  @Action(IncomeActions.AddIncome)
  addIncome(
    ctx: StateContext<IncomeStateModel>,
    action: IncomeActions.AddIncome
  ) {
    let updatedIncome: Income[] = ctx.getState().income;
    updatedIncome === null ? updatedIncome = [] : updatedIncome = updatedIncome; 
    updatedIncome.push(action.payload);
    ctx.patchState({ income: updatedIncome });
  };

  @Action(IncomeActions.DeactivateUserIncomeRecord)
  deactivateUserIncomeRecord(
      ctx: StateContext<IncomeStateModel>,
      action: IncomeActions.DeactivateUserIncomeRecord
  ) {
      let currentIncomeRecords: Income[] = ctx.getState().income;
      currentIncomeRecords === null ? currentIncomeRecords = [] : currentIncomeRecords = currentIncomeRecords; 
      const updatedIncomeRecords: Income[] = [];
      currentIncomeRecords.forEach((record: Income) => {
        if (record.inc_id !== action.payload.inc_id) {
          updatedIncomeRecords.push(record);
        };
      });    
      ctx.patchState({ income: updatedIncomeRecords });
  };
}