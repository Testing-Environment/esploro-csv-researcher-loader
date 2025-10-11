import { NgModule } from '@angular/core';

// Angular Material modules used in Ex Libris Cloud Apps
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@NgModule({
  imports: [
    MatTabsModule,
    MatStepperModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSlideToggleModule
  ],
  exports: [
    MatTabsModule,
    MatStepperModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSlideToggleModule
  ]
})
export class EnhancedMaterialModule { }
