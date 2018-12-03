import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { WorkoutsApiService } from './../services/workouts-api.service';
import * as _ from 'lodash';
import { forkJoin } from 'rxjs';
import { PerformanceTargetsModalComponent } from '../performance-targets-modal/performance-targets-modal.component';

@Component({
  selector: 'app-workouts',
  templateUrl: './workouts.component.html',
  styleUrls: ['./workouts.component.css']
})
export class WorkoutsComponent implements OnInit {
  public workouts = [];
  public loading = false;
  private perfTargets = {};

  constructor(private api: WorkoutsApiService, private modal: NgbModal) {}

  ngOnInit() {
    forkJoin(this.api.getWorkouts(), this.api.getPerfTargets()).subscribe(
      ([workoutsResult, perfTargetsResult]) => {
        this.workouts = workoutsResult;
        this.perfTargets = perfTargetsResult;
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

}
