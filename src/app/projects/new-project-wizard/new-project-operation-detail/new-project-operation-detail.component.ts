import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  AfterViewChecked,
  ChangeDetectorRef,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { combineLatest, debounceTime, Subscription, tap } from 'rxjs';
import {
  Project,
  Process,
  Operation,
  Setup,
  Activity,
  CuttingCondition,
  ActivityTimeComponent,
  TimeComponent,
  NormalizationTask,
  WorkHoldingDevice,
  CuttingTool,
  MeasuringTool,
  Department,
  WorkStation,
} from '../../project/project.model';

import { ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { NewProjectWizardService } from '../new-project-wizard.service';
@Component({
  selector: 'app-new-project-operation-detail',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, FormsModule],
  templateUrl: './new-project-operation-detail.component.html',
  styleUrl: './new-project-operation-detail.component.scss',
})
export class NewProjectOperationDetailComponent implements OnInit, OnDestroy {
  constructor(
    private fb: FormBuilder,
    public projectService: NewProjectWizardService,
    private route: ActivatedRoute
  ) {
    this.operationDetailForm = this.fb.group({
      setups: this.fb.array([]),
      normalizationTasks: this.fb.array([]),
      timeComponents: this.fb.array([]),
      workstation: this.fb.group({
        workstationId: [null, Validators.required],
        machineType: ['', Validators.required],
        type: ['', Validators.required],
        symbol: ['', Validators.required],
      }),
      developedBy: [''],
      checkedBy: [''],
      approvedBy: [''],
      position: [0],
    });
  }
  selectedTools: CuttingTool[] = [];
  currentActivityForm?: FormGroup<any>;

  operationDetailForm: FormGroup;
  currentOperation!: Operation | undefined;
  private projectSubscription: Subscription | undefined;
  private routeSubscription: Subscription | undefined;
  calculate = true;
  setupPreviews: { [key: number]: string } = {};
  activeSetupIndex: number = 0;

  // Dane z serwisu
  workHoldingDevices: WorkHoldingDevice[] = [];
  cuttingTools: CuttingTool[] = [];
  measuringTools: MeasuringTool[] = [];
  departments: Department[] = [];
  workstations: WorkStation[] = [];
  toolSymbols: { [key: number]: string } = {};
  toolCounter = 1;

  // Stany modali
  isWorkHoldingDevicesModalOpen = false;
  isCuttingToolsModalOpen = false;
  isMeasuringToolsModalOpen = false;
  isWorkStationModalOpen = false;
  isNewWorkHoldingDeviceModalOpen = false;
  isNewCuttingToolModalOpen = false;
  isNewMeasuringToolModalOpen = false;
  isNewWorkStationModalOpen = false;

  // Zmienne do filtrowania
  searchWorkHoldingDevicesControl = new FormControl('');
  searchCuttingToolsControl = new FormControl('');
  searchMeasuringToolsControl = new FormControl('');
  searchWorkStationsControl = new FormControl('');

  newWorkHoldingDevice: WorkHoldingDevice = { id: 0, name: '' };
  newCuttingTool: CuttingTool = { id: 0, name: '', type: 'other' };
  newMeasuringTool: MeasuringTool = { id: 0, name: '' };
  newWorkStation: WorkStation = {
    workstationId: 0,
    machineType: '',
    type: '',
    symbol: '',
  };

  onAutoCalculateChanged(event: any) {
    if (event.target.checked) {
      this.calculate = true;
    } else {
      this.calculate = false;
    }
  }

  selectWorkHoldingDevice(fixture: WorkHoldingDevice): void {
    if (this.currentOperation) {
      if (!this.currentOperation.workHoldingDevices)
        this.currentOperation.workHoldingDevices = [];
      this.currentOperation.workHoldingDevices?.push({ ...fixture });
      this.updateProjectOperation();
    }
    this.closeWorkHoldingDevicesModal();
  }
  removeWorkHoldingDevice(index: number): void {
    if (this.currentOperation && this.currentOperation.workHoldingDevices) {
      this.currentOperation.workHoldingDevices.splice(index, 1);
      this.updateProjectOperation();
    }
  }

  removeOperationMeasuringTool(index: number): void {
    if (this.currentOperation && this.currentOperation.measuringTools) {
      this.currentOperation.measuringTools.splice(index, 1);
      this.updateProjectOperation();
    }
  }
  removeActivityTool(setupIndex: number, activityIndex: number): void {
    const activity = this.getActivities(setupIndex).at(activityIndex);
    activity.patchValue({
      tool: null,
      toolAssembly: null,
    });
    this.updateProjectOperation();
  }

  selectWorkStation(workstation: WorkStation): void {
    if (this.currentOperation) {
      // Używamy bezpośrednio workstation z serwisu
      this.currentOperation.workstation = workstation;
      this.operationDetailForm.patchValue({
        workstation: {
          workstationId: workstation.workstationId, // używamy oryginalnego ID
          machineType: workstation.machineType,
          type: workstation.type,
          symbol: workstation.symbol,
        },
      });
      this.updateProjectOperation();
    }
    this.closeWorkStationModal();
  }
  openWorkStationModal() {
    this.isWorkStationModalOpen = true;
  }
  closeWorkStationModal() {
    this.isWorkStationModalOpen = false;
  }

  selectCuttingTool(tool: CuttingTool): void {
    if (!this.currentActivityForm) return;

    if (this.selectedTools.includes(tool)) {
      // Usuwamy narzędzie z wybranych
      this.selectedTools = this.selectedTools.filter((t) => t !== tool);

      // Jeśli nie ma już żadnych wybranych narzędzi, czyścimy oba pola
      if (this.selectedTools.length === 0) {
        this.currentActivityForm.patchValue({
          tool: null,
          toolAssembly: null,
        });
      } else {
        // Jeśli zostało jedno narzędzie, przenosimy je do tool
        this.currentActivityForm.patchValue({
          tool: { ...this.selectedTools[0] },
          toolAssembly: null,
        });
      }
    } else {
      // Dodajemy nowe narzędzie
      if (this.selectedTools.length < 2) {
        this.selectedTools.push(tool);

        if (this.selectedTools.length === 2) {
          // Jeśli mamy dokładnie 2 narzędzia, tworzymy toolAssembly
          const holder = this.selectedTools.find((t) => t.type === 'holder');
          const insert = this.selectedTools.find((t) => t.type === 'insert');

          if (holder && insert) {
            this.currentActivityForm.patchValue({
              toolAssembly: {
                id: Date.now(),
                holder: { ...holder },
                insert: { ...insert },
              },
              tool: null, // Ważne: czyścimy pole tool
            });
          }
        } else {
          // Jeśli mamy 1 narzędzie, ustawiamy je jako tool
          this.currentActivityForm.patchValue({
            tool: { ...tool },
            toolAssembly: null, // Ważne: czyścimy pole toolAssembly
          });
        }
      }
    }

    this.updateProjectOperation();
  }
  selectMeasuringTool(tool: MeasuringTool): void {
    if (this.currentOperation) {
      if (!this.currentOperation.measuringTools)
        this.currentOperation.measuringTools = [];
      this.currentOperation.measuringTools?.push({ ...tool });
      this.updateProjectOperation();
    }
    this.closeMeasuringToolsModal();
  }

  openWorkHoldingDevicesModal() {
    this.isWorkHoldingDevicesModalOpen = true;
  }

  closeWorkHoldingDevicesModal(): void {
    this.isWorkHoldingDevicesModalOpen = false;
  }

  openCuttingToolsModal(activityForm: AbstractControl) {
    this.selectedTools = [];
    if (activityForm instanceof FormGroup) {
      this.currentActivityForm = activityForm;
    }
    this.isCuttingToolsModalOpen = true;
  }

  closeCuttingToolsModal(): void {
    this.isCuttingToolsModalOpen = false;
    this.selectedTools = [];
    this.currentActivityForm = undefined;
  }
  openMeasuringToolsModal() {
    this.isMeasuringToolsModalOpen = true;
  }

  closeMeasuringToolsModal(): void {
    this.isMeasuringToolsModalOpen = false;
  }

  loadResources(): void {
    this.projectService
      .getWorkHoldingDevices()
      .subscribe((devices) => (this.workHoldingDevices = devices.data));
    this.projectService
      .getCuttingTools()
      .subscribe((tools) => (this.cuttingTools = tools.data));
    this.projectService
      .getMeasuringTools()
      .subscribe((tools) => (this.measuringTools = tools.data));
    this.projectService
      .getDepartments()
      .subscribe((departments) => (this.departments = departments.data));
  }

  openNewResourceModal(
    type: 'workHoldingDevice' | 'cuttingTool' | 'measuringTool' | 'workstation'
  ): void {
    switch (type) {
      case 'workHoldingDevice':
        this.newWorkHoldingDevice = { id: 0, name: '' };
        this.isNewWorkHoldingDeviceModalOpen = true;
        break;
      case 'cuttingTool':
        this.newCuttingTool = { id: 0, name: '', type: 'other' };
        this.isNewCuttingToolModalOpen = true;
        break;
      case 'measuringTool':
        this.newMeasuringTool = { id: 0, name: '' };
        this.isNewMeasuringToolModalOpen = true;
        break;
      case 'workstation':
        this.newWorkStation = {
          workstationId: 0,
          machineType: '',
          type: '',
          symbol: '',
        };
        this.isNewWorkStationModalOpen = true;
        break;
    }
  }

  closeNewResourceModal(
    type: 'workHoldingDevice' | 'cuttingTool' | 'measuringTool' | 'workstation'
  ): void {
    switch (type) {
      case 'workHoldingDevice':
        this.isNewWorkHoldingDeviceModalOpen = false;
        break;
      case 'cuttingTool':
        this.isNewCuttingToolModalOpen = false;
        break;
      case 'measuringTool':
        this.isNewMeasuringToolModalOpen = false;
        break;
      case 'workstation':
        this.isNewWorkStationModalOpen = false;
        break;
    }
  }

  addWorkHoldingDevice(): void {
    this.projectService.addWorkHoldingDevice(
      this.projectService.getCurrentProcessIndex(),
      this.projectService.getCurrentOperationIndex(),
      this.newWorkHoldingDevice
    );
    this.closeNewResourceModal('workHoldingDevice');
    this.setOperationDetails();
  }
  addWorkStation(): void {
    this.projectService.updateWorkstation(
      this.projectService.getCurrentProcessIndex(),
      this.projectService.getCurrentOperationIndex(),
      this.newWorkStation
    );
    this.closeNewResourceModal('workstation');
    this.setOperationDetails();
  }

  addCuttingTool(): void {
    this.projectService.addMeasuringTool(
      this.projectService.getCurrentProcessIndex(),
      this.projectService.getCurrentOperationIndex(),
      this.newMeasuringTool
    );
    this.closeNewResourceModal('measuringTool');
    this.setOperationDetails();
  }
  addMeasuringTool(): void {
    this.projectService.addMeasuringTool(
      this.projectService.getCurrentProcessIndex(),
      this.projectService.getCurrentOperationIndex(),
      this.newMeasuringTool
    );
    this.closeNewResourceModal('measuringTool');
    this.setOperationDetails();
  }
  getFilteredWorkHoldingDevices(): WorkHoldingDevice[] {
    const searchTerm =
      this.searchWorkHoldingDevicesControl.value?.toLowerCase() || '';
    return this.workHoldingDevices.filter((device) =>
      device.name.toLowerCase().includes(searchTerm)
    );
  }

  getFilteredCuttingTools(): CuttingTool[] {
    const searchTerm =
      this.searchCuttingToolsControl.value?.toLowerCase() || '';
    return this.cuttingTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(searchTerm) ||
        tool.type.toLowerCase().includes(searchTerm)
    );
  }

  getFilteredMeasuringTools(): MeasuringTool[] {
    const searchTerm =
      this.searchMeasuringToolsControl.value?.toLowerCase() || '';
    return this.measuringTools.filter((tool) =>
      tool.name.toLowerCase().includes(searchTerm)
    );
  }
  getFilteredWorkStations(): WorkStation[] {
    const searchTerm =
      this.searchWorkStationsControl.value?.toLowerCase() || '';
    return this.departments
      .flatMap((department) => department.workstations)
      .filter((station) => station.symbol.toLowerCase().includes(searchTerm));
  }

  showNextSetup() {
    if (this.activeSetupIndex < this.setups.length - 1) {
      this.activeSetupIndex++;
    }
  }

  showPreviousSetup() {
    if (this.activeSetupIndex > 0) {
      this.activeSetupIndex--;
    }
  }
  onImageSelected(event: Event, setupIndex: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.setupPreviews[setupIndex] = reader.result as string;
        this.setups.at(setupIndex).patchValue({
          drawing: reader.result as string,
        });
        this.updateProjectOperation();
      };
      reader.readAsDataURL(file);
    }
  }
  onChangeDrawing(setupIndex: number) {
    this.setups.at(setupIndex).patchValue({
      drawing: '',
    });
    this.setupPreviews[setupIndex] = '';
    this.updateProjectOperation();
  }

  ngOnInit(): void {
    this.projectSubscription = this.projectService.currentProject$.subscribe(
      () => {}
    );
    this.routeSubscription = this.route.params.subscribe(() => {
      this.setOperationDetails();
    });
    this.loadResources();
    this.setOperationDetails();
    this.setOperationDetails();
    this.operationDetailForm
      .get('developedBy')
      ?.valueChanges.subscribe((value) => {
        if (this.currentOperation) {
          this.currentOperation.developedBy = value;
        }
        this.updateProjectOperation();
      });
    this.operationDetailForm
      .get('checkedBy')
      ?.valueChanges.subscribe((value) => {
        if (this.currentOperation) {
          this.currentOperation.checkedBy = value;
        }
        this.updateProjectOperation();
      });
    this.operationDetailForm
      .get('approvedBy')
      ?.valueChanges.subscribe((value) => {
        if (this.currentOperation) {
          this.currentOperation.approvedBy = value;
        }
        this.updateProjectOperation();
      });
    this.operationDetailForm
      .get('position')
      ?.valueChanges.subscribe((value) => {
        if (this.currentOperation) {
          this.currentOperation.position = value;
        }
        this.updateProjectOperation();
      });
  }
  ngOnDestroy(): void {
    if (this.projectSubscription) {
      this.projectSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
  get setups(): FormArray {
    return this.operationDetailForm.get('setups') as FormArray;
  }

  get activeSetup(): FormGroup {
    return this.setups.at(this.activeSetupIndex) as FormGroup;
  }

  get timeComponents(): FormArray {
    return this.operationDetailForm.get('timeComponents') as FormArray;
  }

  get normalizationTasks(): FormArray {
    return this.operationDetailForm.get('normalizationTasks') as FormArray;
  }
  addSetup(): void {
    const setupGroup = this.fb.group({
      setupId: [Date.now(), Validators.required],
      drawing: ['', Validators.required],
      activities: this.fb.array([]),
    });

    this.setups.push(setupGroup);
    this.updateProjectOperation(); // Wywołanie po dodaniu setupu
  }
  addNormalizationTask(): void {
    const processIndex = parseInt(
      this.route.snapshot.params['processIndex'] || 0
    );
    const operationIndex = parseInt(
      this.route.snapshot.params['operationIndex'] || 0
    );
    const currentOperation = this.projectService.getOperationByIndex(
      processIndex,
      operationIndex
    );
    this.normalizationTasks.push(
      this.fb.group({
        id: [Date.now(), Validators.required],
        name: ['', Validators.required],
        timeMinutes: [0, Validators.required],
        operationId: [currentOperation?.operationId],
      })
    );
    this.updateProjectOperation();
  }

  addTimeComponent(): void {
    const processIndex = parseInt(
      this.route.snapshot.params['processIndex'] || 0
    );
    const operationIndex = parseInt(
      this.route.snapshot.params['operationIndex'] || 0
    );
    const currentOperation = this.projectService.getOperationByIndex(
      processIndex,
      operationIndex
    );
    this.timeComponents.push(
      this.fb.group({
        id: [Date.now(), Validators.required],
        name: ['', Validators.required],
        operationId: [currentOperation?.operationId],
      })
    );
    this.updateProjectOperation();
  }
  removeTimeComponent(index: number): void {
    this.timeComponents.removeAt(index);
    this.updateProjectOperation();
  }
  removeSetup(setupIndex: number): void {
    this.setups.removeAt(setupIndex);
    this.updateProjectOperation();
  }
  removeNormalizationTask(index: number): void {
    this.normalizationTasks.removeAt(index);
    this.updateProjectOperation();
  }

  private setupConditionsSubscriptions(activityGroup: FormGroup) {
    const conditions = activityGroup.get('conditions') as FormGroup;

    // Obliczanie Ap
    combineLatest([
      conditions.get('Dp')!.valueChanges,
      conditions.get('Dk')!.valueChanges,
    ])
      .pipe(
        tap(([Dp, Dk]) => {
          if (!this.calculate || !Dp || !Dk) return;
          conditions.patchValue(
            { Ap: ((Dp - Dk) / 2).toFixed(2) },
            { emitEvent: false }
          );
        })
      )
      .subscribe(() => this.updateProjectOperation());

    // Obliczanie n
    combineLatest([
      conditions.get('Dk')!.valueChanges,
      conditions.get('Vc')!.valueChanges,
    ])
      .pipe(
        tap(([Dk, Vc]) => {
          if (!this.calculate || !Dk || !Vc) return;
          conditions.patchValue(
            { n: ((1000 * Vc) / (Math.PI * Dk)).toFixed(2) },
            { emitEvent: false }
          );
        })
      )
      .subscribe(() => this.updateProjectOperation());

    // Obliczanie tg
    combineLatest([
      conditions.get('Dk')!.valueChanges,
      conditions.get('L')!.valueChanges,
      conditions.get('Vc')!.valueChanges,
      conditions.get('f')!.valueChanges,
    ])
      .pipe(
        tap(([Dk, L, Vc, f]) => {
          if (!this.calculate || !Dk || !L || !Vc || !f) return;
          conditions.patchValue(
            { tg: ((L * Dk) / (318 * Vc * f)).toFixed(3) },
            { emitEvent: false }
          );
        })
      )
      .subscribe(() => this.updateProjectOperation());
  }

  addActivity(setupIndex: number): void {
    const activities = this.getActivities(setupIndex);
    const activityTimeComponentsFormArray = this.fb.array(
      this.timeComponents.controls.map((_, index) =>
        this.fb.group({
          id: [Date.now() + index],
          timeComponentId: [this.timeComponents.at(index).get('id')?.value],
          timeMinutes: [0, [Validators.min(0)]],
        })
      )
    );

    const activityGroup = this.fb.group({
      activityId: [Date.now(), Validators.required],
      activityName: ['', Validators.required],
      passes: [1, Validators.required],
      conditions: this.fb.group({
        Dp: [0, Validators.required],
        Dk: [0, Validators.required],
        L: [0, Validators.required],
        Ap: [0, Validators.required],
        f: [0, Validators.required],
        Vc: [0, Validators.required],
        n: [0, Validators.required],
        tg: [0],
      }),
      activityTimeComponents: activityTimeComponentsFormArray,
      toolAssembly: null,
      tool: null,
    });

    console.log('Activity group created:', activityGroup);
    this.setupConditionsSubscriptions(activityGroup);

    const processIndex = parseInt(
      this.route.snapshot.params['processIndex'] || 0
    );
    const operationIndex = parseInt(
      this.route.snapshot.params['operationIndex'] || 0
    );
    this.projectService.addActivity(
      processIndex,
      operationIndex,
      setupIndex,
      activityGroup.value
    );
    this.setOperationDetails();
  }

  getTimeComponentControl(
    setupIndex: number,
    activityIndex: number,
    timeIndex: number
  ): FormControl {
    const activity = this.getActivities(setupIndex).at(activityIndex);
    const activityTimeComponents = activity.get(
      'activityTimeComponents'
    ) as FormArray;

    // Jeśli kontrolka nie istnieje, tworzymy ją
    if (!activityTimeComponents.at(timeIndex)) {
      activityTimeComponents.push(
        this.fb.group({
          id: [Date.now()],
          timeComponentId: [this.timeComponents.at(timeIndex).get('id')?.value],
          timeMinutes: [0],
        })
      );
    }

    return activityTimeComponents
      .at(timeIndex)
      .get('timeMinutes') as FormControl;
  }

  removeActivity(setupIndex: number, activityIndex: number): void {
    const activities = this.getActivities(setupIndex);
    activities.removeAt(activityIndex);
    this.updateProjectOperation();
  }

  addActivityTimeComponent(setupIndex: number, activityIndex: number): void {
    const activityTimeComponents = this.getActivityTimeComponents(
      setupIndex,
      activityIndex
    );
    activityTimeComponents.push(
      this.fb.group({
        id: [Date.now(), Validators.required],
        timeComponentId: ['', Validators.required],
        timeMinutes: [0, Validators.required],
      })
    );
    this.updateProjectOperation();
  }
  removeActivityTimeComponent(
    setupIndex: number,
    activityIndex: number,
    activityTimeComponentIndex: number
  ): void {
    const activityTimeComponents = this.getActivityTimeComponents(
      setupIndex,
      activityIndex
    );
    activityTimeComponents.removeAt(activityTimeComponentIndex);
    this.updateProjectOperation();
  }

  getActivities(setupIndex: number): FormArray {
    const setup = this.setups?.at(setupIndex);
    if (!setup) {
      return this.fb.array([]); // Zwracamy pustą tablicę formularzy jeśli nie ma setupu
    }
    return setup.get('activities') as FormArray;
  }

  getActivityTimeComponents(
    setupIndex: number,
    activityIndex: number
  ): FormArray {
    return this.getActivities(setupIndex)
      .at(activityIndex)
      .get('activityTimeComponents') as FormArray;
  }
  setOperationDetails() {
    console.log('setOperationDetails called');
    const processIndex = this.projectService.getCurrentProcessIndex();
    const operationIndex = this.projectService.getCurrentOperationIndex();

    const currentOperation = this.projectService.getOperationByIndex(
      processIndex,
      operationIndex
    );
    this.currentOperation = currentOperation;
    this.setups.clear();
    this.normalizationTasks.clear();
    this.timeComponents.clear();

    if (currentOperation) {
      this.operationDetailForm.patchValue({
        developedBy: currentOperation.developedBy,
        checkedBy: currentOperation.checkedBy,
        approvedBy: currentOperation.approvedBy,
        position: currentOperation.position,
      });
      if (currentOperation.setups && currentOperation.setups.length > 0) {
        currentOperation.setups.forEach((setup) => {
          const setupControl = this.fb.group({
            setupId: [setup.setupId, Validators.required],
            drawing: [setup.drawing, Validators.required],
            activities: this.fb.array([]),
          });
          if (setup.activities && setup.activities.length > 0) {
            setup.activities.forEach((activity) => {
              const activityControl = this.fb.group({
                activityId: [activity.activityId, Validators.required],
                activityName: [activity.activityName, Validators.required],
                sequence: [activity.sequence, Validators.required],
                passes: [activity.passes, Validators.required],
                conditions: this.fb.group({
                  Dp: [activity.conditions.Dp, Validators.required],
                  Dk: [activity.conditions.Dk, Validators.required],
                  L: [activity.conditions.L, Validators.required],
                  Ap: [activity.conditions.Ap, Validators.required],
                  f: [activity.conditions.f, Validators.required],
                  Vc: [activity.conditions.Vc, Validators.required],
                  n: [activity.conditions.n, Validators.required],
                  tg: [0],
                }),
                activityTimeComponents: this.fb.array([]),
                toolAssembly: activity.toolAssembly
                  ? this.fb.group({
                      id: [activity.toolAssembly.id],
                      insert: this.fb.group({
                        id: [activity.toolAssembly.insert.id],
                        name: [activity.toolAssembly.insert.name],
                        type: [activity.toolAssembly.insert.type],
                      }),
                      holder: this.fb.group({
                        id: [activity.toolAssembly.holder.id],
                        name: [activity.toolAssembly.holder.name],
                        type: [activity.toolAssembly.holder.type],
                      }),
                    })
                  : null,
                tool: activity.tool
                  ? this.fb.group({
                      id: [activity.tool.id],
                      name: [activity.tool.name],
                      type: [activity.tool.type],
                    })
                  : null,
              });
              if (
                activity.activityTimeComponents &&
                activity.activityTimeComponents.length > 0
              ) {
                activity.activityTimeComponents.forEach((actTimeComponent) => {
                  (
                    activityControl.get('activityTimeComponents') as FormArray
                  ).push(
                    this.fb.group({
                      id: [actTimeComponent.id, Validators.required],
                      timeComponentId: [
                        actTimeComponent.timeComponentId,
                        Validators.required,
                      ],
                      timeMinutes: [
                        actTimeComponent.timeMinutes,
                        Validators.required,
                      ],
                    })
                  );
                });
              }
              this.setupConditionsSubscriptions(activityControl);
              (setupControl.get('activities') as FormArray).push(
                activityControl
              );
            });
          }
          this.setups.push(setupControl);
        });
      }
      if (
        currentOperation.normalizationTasks &&
        currentOperation.normalizationTasks.length > 0
      ) {
        currentOperation.normalizationTasks.forEach((task) => {
          this.normalizationTasks.push(
            this.fb.group({
              id: [task.id, Validators.required],
              name: [task.name, Validators.required],
              timeMinutes: [task.timeMinutes, Validators.required],
              operationId: [currentOperation.operationId],
            })
          );
        });
      }
      if (
        currentOperation.timeComponents &&
        currentOperation.timeComponents.length > 0
      ) {
        currentOperation.timeComponents.forEach((timeComponent) => {
          this.timeComponents.push(
            this.fb.group({
              id: [timeComponent.id, Validators.required],
              name: [timeComponent.name, Validators.required],
              operationId: [currentOperation.operationId],
            })
          );
        });
      }
      if (currentOperation.workstation) {
        this.operationDetailForm.patchValue({
          workstation: {
            workstationId: currentOperation.workstation.workstationId,
            machineType: currentOperation.workstation.machineType,
            type: currentOperation.workstation.type,
            symbol: currentOperation.workstation.symbol,
          },
        });
      } else {
        this.operationDetailForm.patchValue({
          workstation: null,
        });
      }
    }
  }

  updateProjectOperation() {
    console.log('updateProjectOperation called');

    const processIndex = this.projectService.getCurrentProcessIndex();
    const operationIndex = this.projectService.getCurrentOperationIndex();
    const currentOperation = this.projectService.getOperationByIndex(
      processIndex,
      operationIndex
    );
    if (!currentOperation) return;

    const updatedSetups: Setup[] = this.setups.controls.map((setupControl) => {
      const updatedActivities: Activity[] = (
        setupControl.get('activities') as FormArray
      ).controls.map((activityControl) => {
        console.log('Returning Activity', {
          activityId: activityControl.get('activityId')?.value,
          activityName: activityControl.get('activityName')?.value,
          sequence: activityControl.get('sequence')?.value,
          passes: activityControl.get('passes')?.value,
          conditions: activityControl.get('conditions')?.value,
          activityTimeComponents: (
            activityControl.get('activityTimeComponents') as FormArray
          ).controls.map((activityTimeComponentControl) => ({
            id: activityTimeComponentControl.get('id')?.value,
            timeComponentId:
              activityTimeComponentControl.get('timeComponentId')?.value,
            timeMinutes: activityTimeComponentControl.get('timeMinutes')?.value,
            activityId: activityControl.get('activityId')?.value,
          })),
          tool: activityControl.get('tool')?.value || null,
          toolAssembly: activityControl.get('toolAssembly')?.value || null,
        });

        const updatedActivityTimeComponents: ActivityTimeComponent[] = (
          activityControl.get('activityTimeComponents') as FormArray
        ).controls.map((activityTimeComponentControl) => ({
          id: activityTimeComponentControl.get('id')?.value,
          timeComponentId:
            activityTimeComponentControl.get('timeComponentId')?.value,
          timeMinutes: activityTimeComponentControl.get('timeMinutes')?.value,
          activityId: activityControl.get('activityId')?.value,
        }));
        const conditionsValue = activityControl.get('conditions')?.value;
        return {
          activityId: activityControl.get('activityId')?.value,
          activityName: activityControl.get('activityName')?.value,
          sequence: activityControl.get('sequence')?.value,
          passes: activityControl.get('passes')?.value,
          conditions: {
            ...conditionsValue,
            Ap: parseFloat(conditionsValue.Ap),
            Dp: parseFloat(conditionsValue.Dp),
            Dk: parseFloat(conditionsValue.Dk),
            L: parseFloat(conditionsValue.L),
            f: parseFloat(conditionsValue.f),
            n: parseFloat(conditionsValue.n),
            Vc: parseFloat(conditionsValue.Vc),
          },
          activityTimeComponents: updatedActivityTimeComponents,
          tool: activityControl.get('tool')?.value || null,
          toolAssembly: activityControl.get('toolAssembly')?.value || null,
        };
      });
      return {
        setupId: setupControl.get('setupId')?.value,
        drawing: setupControl.get('drawing')?.value,
        activities: updatedActivities,
      };
    });
    const updatedNormalizationTasks: NormalizationTask[] =
      this.normalizationTasks.controls.map((taskControl) => ({
        id: taskControl.get('id')?.value,
        name: taskControl.get('name')?.value,
        timeMinutes: taskControl.get('timeMinutes')?.value,
        operationId: currentOperation!.operationId,
      }));
    const updatedTimeComponents: TimeComponent[] =
      this.timeComponents.controls.map((timeComponentControl) => ({
        id: timeComponentControl.get('id')?.value,
        name: timeComponentControl.get('name')?.value,
        operationId: currentOperation!.operationId,
      }));
    const updatedWorkstation = this.operationDetailForm.get('workstation')
      ?.value
      ? {
          workstationId:
            this.operationDetailForm.get('workstation')?.value.workstationId,
          machineType:
            this.operationDetailForm.get('workstation')?.value.machineType,
          type: this.operationDetailForm.get('workstation')?.value.type,
          symbol: this.operationDetailForm.get('workstation')?.value.symbol,
        }
      : undefined;

    const updatedProject: Project = {
      ...this.projectService.getProject(),
      processes: this.projectService
        .getProject()
        .processes.map((process, index) => {
          if (index === processIndex) {
            return {
              ...process,
              operations: process.operations.map((operation) => {
                if (operation.operationId === currentOperation!.operationId) {
                  return {
                    ...operation,
                    setups: updatedSetups,
                    normalizationTasks: updatedNormalizationTasks,
                    timeComponents: updatedTimeComponents,
                    ...(updatedWorkstation
                      ? { workstation: updatedWorkstation }
                      : {}),
                    developedBy:
                      this.operationDetailForm.get('developedBy')?.value !== ''
                        ? this.operationDetailForm.get('developedBy')?.value
                        : operation.developedBy,
                    checkedBy:
                      this.operationDetailForm.get('checkedBy')?.value !== ''
                        ? this.operationDetailForm.get('checkedBy')?.value
                        : operation.checkedBy,
                    approvedBy:
                      this.operationDetailForm.get('approvedBy')?.value !== ''
                        ? this.operationDetailForm.get('approvedBy')?.value
                        : operation.approvedBy,
                    position:
                      this.operationDetailForm.get('position')?.value ||
                      operation.position,
                  };
                }
                return operation;
              }),
            };
          }
          return process;
        }),
    };
    // console.log('Before setCurrentProject', updatedProject);

    this.projectService.setCurrentProject(updatedProject);
  }
}
