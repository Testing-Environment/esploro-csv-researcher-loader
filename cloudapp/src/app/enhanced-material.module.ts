import { NgModule } from '@angular/core';

// Angular Material modules used in Ex Libris Cloud Apps
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClipboardModule } from '@angular/cdk/clipboard';

const modules = [
  MatTabsModule,
  MatStepperModule,
  MatProgressBarModule,
  MatTooltipModule,
  ClipboardModule
];

@NgModule({
  imports: modules,
  exports: modules
})
export class EnhancedMaterialModule { }
