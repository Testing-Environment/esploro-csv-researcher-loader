import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material modules used in Ex Libris Cloud Apps
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const modules = [
  CommonModule,
  MatTabsModule,
  MatStepperModule,
  MatProgressBarModule,
  MatTooltipModule,
  MatButtonModule,
  MatIconModule,
  ClipboardModule
];

@NgModule({
  imports: modules,
  exports: modules
})
export class EnhancedMaterialModule { }
