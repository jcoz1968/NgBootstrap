import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { WorkoutsApiService } from './../services/workouts-api.service';
import * as _ from 'lodash';
import { forkJoin } from 'rxjs';
import { PerformanceTargetsModalComponent } from '../performance-targets-modal/performance-targets-modal.component';

@Component({
  selector: 'app-workouts',
  templateUrl: './workouts.component.html',
  styleUrls: ['./workouts.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class WorkoutsComponent implements OnInit {
  public workouts = [];
  public loading = false;
  private perfTargets = {};
  public totals = {};

  constructor(private api: WorkoutsApiService, private modal: NgbModal) {}

  ngOnInit() {
    forkJoin(this.api.getWorkouts(), this.api.getPerfTargets()).subscribe(
      ([workoutsResult, perfTargetsResult]) => {
        this.workouts = workoutsResult;
        this.perfTargets = perfTargetsResult;
        this.calculatePerformance();
        this.loading = false;
        console.log('**workouts', this.workouts, this.perfTargets);
      }
    );
  }

  deleteWorkout(id, deleteModal) {
    const options: NgbModalOptions = { size: 'sm' };
    this.modal.open(deleteModal, options).result.then(
      result => {
        this.api
          .deleteWorkout(id)
          .subscribe(data => _.remove(this.workouts, { id: id }));
      },
      reason => console.log(`Dismissed: ${reason}`)
    );
  }

  setPerfTargets() {
    const modalRef = this.modal.open(PerformanceTargetsModalComponent);
    modalRef.componentInstance.perfTargets = this.perfTargets;
    modalRef.result.then(result => {
      console.log('Modal result', result);
      this.loading = true;
      this.api.savePerfTargets(result).subscribe(data => {
        this.perfTargets = data;
        this.loading = false;
      });
    }, reason => {
      console.log(`Dismissed reason: ${reason}`);
    });
  }

  calculatePerformance() {
    const bikeTotal = _.chain(this.workouts).filter(x => x.type === 'bike').sumBy(x => +x.distance).value();
    const rowTotal = _.chain(this.workouts).filter(x => x.type === 'row').sumBy(x => +x.distance).value();
    const runTotal = _.chain(this.workouts).filter(x => x.type === 'run').sumBy(x => +x.distance).value();
    this.totals = { bike: bikeTotal, row: rowTotal, run: runTotal };
    console.log('**totals', this.totals);
  }

  getPBType(total: number, target: number) {
    const pct = (total / target) * 100;
    if (pct < 25) {
      return 'success';
    } else if (pct > 25 && pct < 50) {
      return 'info';
    } else if (pct > 50 && pct < 75) {
      return 'warning';
    }  else if (pct > 75) {
      return 'danger';
    }
  }

}
