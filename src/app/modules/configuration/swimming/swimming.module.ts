import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwimmingComponent } from './swimming.component';
import { NgRelaxModule } from 'src/app/ng-relax/ng-relax.module';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [SwimmingComponent],
  imports: [
    CommonModule,
    NgRelaxModule,
    NgZorroAntdModule,
    RouterModule.forChild([
      {
        path: '',
        component: SwimmingComponent
      }
    ])
  ]
})
export class SwimmingModule { }
