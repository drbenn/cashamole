import { Chip } from "./chips.model";
import { BalanceSheetEntry, DashboardHistoryData, Expense, Income, Invest } from "./core.model";

export interface UserRegister {
    email: string,
    username: string,
    password: string
};

export interface UserLogin {
    username: string,
    password: string
};

export interface User {
    id?: number;
    username: string;
    email: string;
    join_date?: string;
};

export interface UserLoginData {
    basicProfile: User,
    income: Income[],
    investments: Invest[],
    expenses: Expense[],
    balanceSheetEntries: BalanceSheetEntry[],
    chips: Chip[],
    dashboardHistory: DashboardHistoryData
};