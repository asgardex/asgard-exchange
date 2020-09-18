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
    path: 'stake',
    loadChildren: () => import('./stake/stake.module').then(m => m.StakeModule),
  },
  {
    path: 'unstake',
    loadChildren: () => import('./unstake/unstake.module').then(m => m.UnstakeModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
