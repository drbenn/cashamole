import { Injectable } from '@angular/core';
import { Action, State, StateContext, Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { IncomeActions } from '../income/income.actions';
import { Income } from '../../model/core.model';


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
    private router: Router
    ) {}


  @Action(IncomeActions.SetIncomeOnLogin)
  setIncomeOnLogin(
    ctx: StateContext<IncomeStateModel>,
    action: IncomeActions.SetIncomeOnLogin
  ) {
    ctx.patchState({ 
      income: action.payload
    });
  }

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
}