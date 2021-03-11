import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'swap',
    pathMatch: 'full'
  },
  {
    path: 'swap',
    loadChildren: () => import('./swap/swap.module').then(m => m.SwapModule),
  },
  {
    path: 'pool',
    loadChildren: () => import('./pool/pool.module').then(m => m.PoolModule),
  },
  {
    path: 'create-pool',
    loadChildren: () => import('./pool-create/pool-create.module').then(m => m.PoolCreateModule),
  },
  {
    path: 'deposit',
    loadChildren: () => import('./deposit/deposit.module').then(m => m.DepositModule),
  },
  {
    path: 'withdraw',
    loadChildren: () => import('./withdraw/withdraw.module').then(m => m.WithdrawModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
