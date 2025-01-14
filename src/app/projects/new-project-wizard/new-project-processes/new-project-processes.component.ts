import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { NewProjectWizardService } from '../new-project-wizard.service';
import { Subscription } from 'rxjs';
import { Process, Project } from '../../project/project.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-new-project-processes',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './new-project-processes.component.html',
  styleUrl: './new-project-processes.component.scss',
})
export class NewProjectProcessesComponent implements OnInit, OnDestroy {
  processesForm: FormGroup;
  private projectSubscription: Subscription | undefined;
  private routeSubscription: Subscription | undefined;

  constructor(
    private fb: FormBuilder,
    private projectService: NewProjectWizardService,
    private route: ActivatedRoute
  ) {
    this.processesForm = this.fb.group({
      processes: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.projectSubscription = this.projectService.currentProject$.subscribe(
      (project) => {}
    );
    this.routeSubscription = this.route.params.subscribe(() => {
      this.setProcesses(this.projectService.getProject());
    });
    this.setProcesses(this.projectService.getProject());
    this.updateProjectProcesses(); // Wywołaj także przy inicjalizacji
  }

  ngOnDestroy() {
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  get processes(): FormArray {
    return this.processesForm.get('processes') as FormArray;
  }

  addProcess() {
    this.processes.push(
      this.fb.group({
        blank: this.fb.group({
          name: [''],
          blankId: [Date.now()],
        }),
        processId: [Date.now()],
        operations: this.fb.array([]),
      })
    );
    this.updateProjectProcesses(); // Wywołaj po dodaniu
  }

  removeProcess(index: number) {
    this.processes.removeAt(index);
    this.updateProjectProcesses(); // Wywołaj po usunięciu
  }

  setProcesses(project: Project) {
    this.processes.clear();
    if (project?.processes && project.processes.length > 0) {
      project.processes.forEach((process) => {
        this.processes.push(
          this.fb.group({
            blank: this.fb.group({
              name: [process.blank.name],
              blankId: [process.blank.blankId],
            }),
            processId: [process.processId],
            operations: this.fb.array(process.operations),
          })
        );
      });
    }
  }

  updateProjectProcesses() {
    const updatedProcesses: Process[] = this.processes.controls.map(
      (control, index) => ({
        processId: control.get('processId')?.value,
        blank: {
          blankId: control.get('blank')?.get('blankId')?.value,
          name: control.get('blank')?.get('name')?.value,
        },
        operations: control.get('operations')?.value,
        developedBy: '',
        checkedBy: '',
        approvedBy: '',
      })
    );
    const updatedProject: Project = {
      ...this.projectService.getProject(),
      processes: updatedProcesses,
    };
    this.projectService.setCurrentProject(updatedProject);
  }
}
