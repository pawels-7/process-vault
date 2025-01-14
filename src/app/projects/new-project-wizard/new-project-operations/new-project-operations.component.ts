import {
  Component,
  inject,
  Input,
  input,
  OnDestroy,
  OnInit,
  Output,
  output,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NewProjectWizardService } from '../new-project-wizard.service';
import { HttpClient } from '@angular/common/http';
import {
  Department,
  Operation,
  Process,
  Project,
  WorkStation,
} from '../../project/project.model';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-new-project-operations',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './new-project-operations.component.html',
  styleUrl: './new-project-operations.component.scss',
})
export class NewProjectOperationsComponent implements OnInit, OnDestroy {
  operationsForm: FormGroup;
  private projectSubscription: Subscription | undefined;
  private routeSubscription: Subscription | undefined;

  constructor(
    private fb: FormBuilder,
    private projectService: NewProjectWizardService,
    private route: ActivatedRoute
  ) {
    this.operationsForm = this.fb.group({
      operations: this.fb.array([]),
      developedBy: ['', Validators.required],
      checkedBy: ['', Validators.required],
      approvedBy: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.projectSubscription = this.projectService.currentProject$.subscribe(
      (project) => {}
    );

    this.routeSubscription = this.route.params.subscribe(() => {
      this.setOperations();
    });

    this.setOperations();
  }
  ngOnDestroy() {
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
  get operations(): FormArray {
    return this.operationsForm.get('operations') as FormArray;
  }
  trackByFn(index: number, item: any): any {
    return item.value.operationId;
  }
  addOperation() {
    this.operations.push(
      this.fb.group({
        operationName: ['', Validators.required],
        sequence: [0, Validators.required],
        operationId: [Date.now(), Validators.required],
      })
    );
  }
  removeOperation(operationIndex: number) {
    console.log('Usuwam operację o indeksie:', operationIndex);
    this.operations.removeAt(operationIndex);
    this.updateProjectProcesses();
  }
  setOperations() {
    this.operations.clear();
    const processIndex = parseInt(
      this.route.snapshot.params['processIndex'] || 0
    );

    const currentProcess = this.projectService.getProcessByIndex(processIndex);
    console.log('Dane z serwisu:', currentProcess?.operations);
    if (currentProcess?.operations && currentProcess!.operations.length > 0) {
      currentProcess?.operations.forEach((operation) => {
        this.operations.push(
          this.fb.group({
            operationName: [operation.operationName, Validators.required],
            sequence: [operation.sequence, Validators.required],
            operationId: [operation.operationId, Validators.required],
            position: [operation.position, Validators.required],
          })
        );
      });
      // Ustawienie wartości dla developedBy, checkedBy i approvedBy
      this.operationsForm.patchValue({
        developedBy: currentProcess?.developedBy,
        checkedBy: currentProcess?.checkedBy,
        approvedBy: currentProcess?.approvedBy,
      });
    }
  }
  updateProjectProcesses() {
    const processIndex = parseInt(
      this.route.snapshot.params['processIndex'] || 0
    );
    const currentProcess = this.projectService.getProcessByIndex(processIndex);
    if (!currentProcess) return;

    console.log(
      'Dane przed aktualizacją:',
      this.operations.controls.map((x, index) => ({ ...x.value }))
    );
    const updatedOperations: Operation[] = this.operations.controls.map(
      (operationControl, index) => ({
        operationId: operationControl.get('operationId')?.value,
        operationName: operationControl.get('operationName')?.value,
        sequence: (index + 1) * 10,
        setups: [],
        normalizationTasks: [],
        position: 0,
        timeComponents: [],
        workHoldingDevices: [],
        measuringTools: [],
        workstation: {
          workstationId: 0,
          machineType: '',
          type: '',
          symbol: '',
        },
        developedBy: '',
        checkedBy: '',
        approvedBy: '',
      })
    );
    const updatedProject: Project = {
      ...this.projectService.getProject(),
      processes: this.projectService
        .getProject()
        .processes.map((process, index) => {
          if (index === processIndex) {
            return {
              ...process,
              operations: updatedOperations,
              developedBy: this.operationsForm.get('developedBy')?.value,
              checkedBy: this.operationsForm.get('checkedBy')?.value,
              approvedBy: this.operationsForm.get('approvedBy')?.value,
            };
          }
          return process;
        }),
    };
    this.projectService.setCurrentProject(updatedProject);
    console.log('Dane po aktualizacji:', updatedProject);
  }
}
