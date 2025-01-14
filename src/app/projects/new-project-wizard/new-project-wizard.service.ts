import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  Activity,
  ActivityTimeComponent,
  Blank,
  CuttingCondition,
  CuttingTool,
  Department,
  MeasuringTool,
  NormalizationTask,
  Operation,
  Order,
  Process,
  Project,
  Setup,
  TimeComponent,
  ToolAssembly,
  WorkHoldingDevice,
  WorkStation,
  Workpiece,
} from '../project/project.model';
import { HttpClient } from '@angular/common/http';
import { ProjectService } from '../project/project.service';
import { Router } from '@angular/router';
import { API } from '../../app.config';

@Injectable({
  providedIn: 'root',
})
export class NewProjectWizardService {
  private currentProject: Project = this.getEmptyProject();
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private projectSubject = new BehaviorSubject<Project>(this.currentProject);
  public currentProject$ = this.projectSubject.asObservable();

  private currentProcessIndex = 0;
  private currentOperationIndex = 0;

  constructor(private http: HttpClient) {}
  getEmptyProject(): Project {
    return {
      projectId: Date.now(),
      partName: '',
      productName: '',
      unitsPerProduct: 0,
      workpiece: {
        workpieceId: Date.now(),
        drawing: '',
      },
      processes: [],
      order: {
        orderId: Date.now(),
        unitsInOrder: 0,
        unitsPerBatch: 0,
        completionDate: new Date(),
      },
      material: '',
      unitMass: 0,
      materialStandard: 0,
      materialCost: 0,
    };
  }
  getCurrentProcessIndex(): number {
    return this.currentProcessIndex;
  }
  getCurrentOperationIndex(): number {
    return this.currentOperationIndex;
  }
  resetIndexes() {
    this.currentOperationIndex = 0;
  }
  setCurrentProject(project: Project) {
    this.currentProject = project;
    this.projectSubject.next(this.currentProject);
  }

  getProject(): Project {
    return this.currentProject;
  }

  addProcess(process: Process): void {
    this.currentProject.processes.push(process);
    this.projectSubject.next(this.currentProject);
  }

  addOperation(processIndex: number, operation: Operation) {
    if (!this.currentProject.processes[processIndex]) {
      console.error(`Proces o indeksie ${processIndex} nie istnieje.`);
      return;
    }
    this.currentProject.processes[processIndex].operations.push(operation);
    this.projectSubject.next(this.currentProject);
  }

  addSetup(processIndex: number, operationIndex: number, setup: Setup) {
    if (
      !this.currentProject.processes[processIndex]?.operations[operationIndex]
    ) {
      console.error(
        `Operacja o indeksie ${operationIndex} w procesie o indeksie ${processIndex} nie istnieje.`
      );
      return;
    }
    this.currentProject.processes[processIndex].operations[
      operationIndex
    ].setups.push(setup);
    this.projectSubject.next(this.currentProject);
  }
  addActivity(
    processIndex: number,
    operationIndex: number,
    setupIndex: number,
    activity: any
  ) {
    if (
      !this.currentProject.processes[processIndex]?.operations[operationIndex]
        ?.setups[setupIndex]
    ) {
      console.error(
        `Setup o indeksie ${setupIndex} w operacji o indeksie ${operationIndex} w procesie o indeksie ${processIndex} nie istnieje.`
      );
      return;
    }

    const operation =
      this.currentProject.processes[processIndex].operations[operationIndex];
    let nextSequence = 1;
    if (operation.setups && operation.setups.length > 0) {
      for (let i = 0; i < operation.setups.length; i++) {
        const setup = operation.setups[i];
        if (setup.activities && setup.activities.length > 0) {
          nextSequence =
            Math.max(...setup.activities.map((act) => act.sequence)) + 1;
        }
      }
    }

    activity.sequence = nextSequence; // Assign sequence here
    this.currentProject.processes[processIndex].operations[
      operationIndex
    ].setups[setupIndex].activities.push(activity);
    this.projectSubject.next(this.currentProject);
  }
  updateCuttingCondition(
    processIndex: number,
    operationIndex: number,
    setupIndex: number,
    activityIndex: number,
    cuttingCondition: CuttingCondition
  ) {
    if (
      !this.currentProject.processes[processIndex]?.operations[operationIndex]
        ?.setups[setupIndex]?.activities[activityIndex]
    ) {
      console.error(
        `Activity o indeksie ${activityIndex} w setup o indeksie ${setupIndex} w operacji o indeksie ${operationIndex} w procesie o indeksie ${processIndex} nie istnieje.`
      );
      return;
    }
    this.currentProject.processes[processIndex].operations[
      operationIndex
    ].setups[setupIndex].activities[activityIndex].conditions =
      cuttingCondition;
    this.projectSubject.next(this.currentProject);
  }
  updateToolAssembly(
    processIndex: number,
    operationIndex: number,
    setupIndex: number,
    activityIndex: number,
    toolAssembly: ToolAssembly
  ) {
    if (
      !this.currentProject.processes[processIndex]?.operations[operationIndex]
        ?.setups[setupIndex]?.activities[activityIndex]
    ) {
      console.error(
        `Activity o indeksie ${activityIndex} w setup o indeksie ${setupIndex} w operacji o indeksie ${operationIndex} w procesie o indeksie ${processIndex} nie istnieje.`
      );
      return;
    }
    this.currentProject.processes[processIndex].operations[
      operationIndex
    ].setups[setupIndex].activities[activityIndex].toolAssembly = toolAssembly;
    this.projectSubject.next(this.currentProject);
  }

  addActivityTimeComponent(
    processIndex: number,
    operationIndex: number,
    setupIndex: number,
    activityIndex: number,
    activityTimeComponent: ActivityTimeComponent
  ) {
    if (
      !this.currentProject.processes[processIndex]?.operations[operationIndex]
        ?.setups[setupIndex]?.activities[activityIndex]
    ) {
      console.error(
        `Activity o indeksie ${activityIndex} w setup o indeksie ${setupIndex} w operacji o indeksie ${operationIndex} w procesie o indeksie ${processIndex} nie istnieje.`
      );
      return;
    }
    this.currentProject.processes[processIndex].operations[
      operationIndex
    ].setups[setupIndex].activities[activityIndex].activityTimeComponents.push(
      activityTimeComponent
    );
    this.projectSubject.next(this.currentProject);
  }
  addNormalizationTask(
    processIndex: number,
    operationIndex: number,
    normalizationTask: NormalizationTask
  ) {
    if (
      !this.currentProject.processes[processIndex]?.operations[operationIndex]
    ) {
      console.error(
        `Operacja o indeksie ${operationIndex} w procesie o indeksie ${processIndex} nie istnieje.`
      );
      return;
    }
    this.currentProject.processes[processIndex].operations[
      operationIndex
    ].normalizationTasks.push(normalizationTask);
    this.projectSubject.next(this.currentProject);
  }
  addTimeComponent(
    processIndex: number,
    operationIndex: number,
    timeComponent: TimeComponent
  ) {
    if (
      !this.currentProject.processes[processIndex]?.operations[operationIndex]
    ) {
      console.error(
        `Operacja o indeksie ${operationIndex} w procesie o indeksie ${processIndex} nie istnieje.`
      );
      return;
    }
    this.currentProject.processes[processIndex].operations[
      operationIndex
    ].timeComponents.push(timeComponent);
    this.projectSubject.next(this.currentProject);
  }
  addWorkHoldingDevice(
    processIndex: number,
    operationIndex: number,
    workHoldingDevice: WorkHoldingDevice
  ) {
    if (
      !this.currentProject.processes[processIndex]?.operations[operationIndex]
    ) {
      console.error(
        `Operacja o indeksie ${operationIndex} w procesie o indeksie ${processIndex} nie istnieje.`
      );
      return;
    }
    this.currentProject.processes[processIndex].operations[
      operationIndex
    ].workHoldingDevices.push(workHoldingDevice);
    this.projectSubject.next(this.currentProject);
  }
  addMeasuringTool(
    processIndex: number,
    operationIndex: number,
    measuringTool: MeasuringTool
  ) {
    if (
      !this.currentProject.processes[processIndex]?.operations[operationIndex]
    ) {
      console.error(
        `Operacja o indeksie ${operationIndex} w procesie o indeksie ${processIndex} nie istnieje.`
      );
      return;
    }
    this.currentProject.processes[processIndex].operations[
      operationIndex
    ].measuringTools.push(measuringTool);
    this.projectSubject.next(this.currentProject);
  }
  updateWorkstation(
    processIndex: number,
    operationIndex: number,
    workstation: WorkStation
  ) {
    if (
      !this.currentProject.processes[processIndex]?.operations[operationIndex]
    ) {
      console.error(
        `Operacja o indeksie ${operationIndex} w procesie o indeksie ${processIndex} nie istnieje.`
      );
      return;
    }
    this.currentProject.processes[processIndex].operations[
      operationIndex
    ].workstation = workstation;
    this.projectSubject.next(this.currentProject);
  }
  getProcessByIndex(index: number): Process | undefined {
    return this.currentProject.processes[index];
  }

  getCurrentProcess(): Process | undefined {
    return this.currentProject.processes[this.currentProcessIndex];
  }

  getOperationByIndex(
    processIndex: number,
    operationIndex: number
  ): Operation | undefined {
    return this.currentProject.processes[processIndex]?.operations[
      operationIndex
    ];
  }
  getCurrentOperation(): Operation | undefined {
    return this.currentProject.processes[this.currentProcessIndex]?.operations[
      this.currentOperationIndex
    ];
  }

  canNextProcess(): boolean {
    if (this.currentProcessIndex < this.currentProject.processes.length - 1) {
      console.log('can next process');
      return true;
    }
    return false;
  }

  nextProcess() {
    console.log('next process');
    this.currentProcessIndex++;
    this.currentOperationIndex = 0;
  }

  canNextOperation(): boolean {
    if (!this.currentProject.processes[this.currentProcessIndex]) return false;
    if (
      this.currentOperationIndex <
      this.currentProject.processes[this.currentProcessIndex].operations
        .length -
        1
    ) {
      console.log('can next operation');
      return true;
    }
    return false;
  }

  nextOperation() {
    console.log('next Operation');
    this.currentOperationIndex++;
  }

  canPreviousOperation(): boolean {
    if (this.currentOperationIndex > 0) {
      return true;
    }
    return false;
  }

  previousOperation() {
    this.currentOperationIndex--;
  }

  canPreviousProcess(): boolean {
    if (this.currentProcessIndex > 0) {
      return true;
    }
    return false;
  }

  previousProcess() {
    this.currentProcessIndex--;
    this.currentOperationIndex = 0;
  }

  //////////////////////
  getWorkHoldingDevices() {
    return this.http.get<{ data: WorkHoldingDevice[] }>(
      `${API}/work-holding-devices`
    );
  }

  getCuttingTools() {
    return this.http.get<{ data: CuttingTool[] }>(`${API}/cutting-tools`);
  }

  getMeasuringTools() {
    return this.http.get<{ data: MeasuringTool[] }>(`${API}/measuring-tools`);
  }

  getDepartments() {
    return this.http.get<{ data: Department[] }>(`${API}/departments`);
  }

  saveProject() {
    console.log(this.currentProject);
    this.http.post(`${API}/projects`, this.currentProject).subscribe((res) => {
      this.projectService.refreshProjects();
    });
    // clear form
    this.currentProject = this.getEmptyProject();
    this.router.navigate(['']);
  }
}
