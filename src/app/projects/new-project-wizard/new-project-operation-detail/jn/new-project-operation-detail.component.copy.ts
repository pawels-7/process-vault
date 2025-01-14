import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NewProjectWizardService } from '../new-project-wizard.service';
import {
  Department,
  MeasuringTool,
  CuttingTool,
  WorkHoldingDevice,
  WorkStation,
} from '../../project/project.model';

// Interfejsy dla typów zasobów

@Component({
  selector: 'app-new-project-operation-detail',
  templateUrl: './new-project-operation-detail.component.html',
  styleUrls: ['./new-project-operation-detail.component.scss'],
  imports: [ReactiveFormsModule, FormsModule],
  standalone: true,
})
export class NewProjectOperationDetailComponent implements OnInit {
  @Input() processIndex!: number;
  @Input() operationIndex!: number;
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  currentFixtureIndex = 0;

  selectedFixtureIndex: number | null = null;
  selectedOperationIndex: number | null = null;
  isModalOpen = false;

  // Dane z serwisu
  processingFixtures: WorkHoldingDevice[] = [];
  toolHolders: CuttingTool[] = [];
  measuringTools: MeasuringTool[] = [];
  departments: Department[] = [];
  workStations: WorkStation[] = [];

  // Stany modali
  isProcessingFixturesModalOpen = false;
  isToolHoldersModalOpen = false;
  isMeasuringToolsModalOpen = false;
  isWorkStationModalOpen = false;

  ////////////////////////////////////////
  newProcessingFixtureForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  newToolHolderForm = this.fb.group({
    name: ['', Validators.required],
    type: ['', Validators.required],
  });

  // Zmienne do filtrowania
  searchProcessingFixturesControl = new FormControl('');
  searchToolHoldersControl = new FormControl('');
  searchMeasuringToolsControl = new FormControl('');
  searchWorkStationsControl = new FormControl('');
  isNewProcessingFixtureModalOpen = false;
  isNewToolHolderModalOpen = false;
  isNewMeasuringToolModalOpen = false;
  isNewWorkStationModalOpen = false;

  // Metody filtrowania
  getFilteredProcessingFixtures(): WorkHoldingDevice[] {
    console.log(this.processingFixtures);
    const searchTerm =
      this.searchProcessingFixturesControl.value?.toLowerCase() || '';
    return this.processingFixtures.filter((fixture) =>
      fixture.name.toLowerCase().includes(searchTerm)
    );
  }

  getFilteredToolHolders(): CuttingTool[] {
    const searchTerm = this.searchToolHoldersControl.value?.toLowerCase() || '';
    return this.toolHolders.filter(
      (holder) =>
        holder.name.toLowerCase().includes(searchTerm) ||
        holder.type.toLowerCase().includes(searchTerm)
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
    return this.workStations.filter((station) =>
      station.machineType.toLowerCase().includes(searchTerm)
    );
  }

  // Metody dodawania nowych elementów
  newProcessingFixture: WorkHoldingDevice = {
    id: 0,
    name: '',
  };
  newToolHolder: CuttingTool = { id: 0, name: '', type: 'other' };
  newMeasuringTool: MeasuringTool = { id: 0, name: '' };
  newWorkStation: WorkStation = {
    workStationId: 0,
    machineType: '',
    type: '',
    symbol: '',
  };

  openNewResourceModal(
    type: 'processingFixture' | 'toolHolder' | 'measuringTool' | 'workStation'
  ): void {
    switch (type) {
      case 'processingFixture':
        this.newProcessingFixture = { id: 0, name: '' };
        this.isNewProcessingFixtureModalOpen = true;
        break;
      case 'toolHolder':
        this.newToolHolder = { id: 0, name: '', type: 'other' };
        this.isNewToolHolderModalOpen = true;
        break;
      case 'measuringTool':
        this.newMeasuringTool = { id: 0, name: '' };
        this.isNewMeasuringToolModalOpen = true;
        break;
      case 'workStation':
        this.newWorkStation = {
          workStationId: 0,
          machineType: '',
          type: '',
          symbol: '',
        };
        this.isNewWorkStationModalOpen = true;
        break;
    }
  }

  // saveNewResource(
  //   type: 'processingFixture' | 'toolHolder' | 'measuringTool' | 'workStation'
  // ): void {
  //   switch (type) {
  //     case 'processingFixture':
  //       if (this.newProcessingFixtureForm.valid) {
  //         const newFixture: WorkHoldingDevice = this.newProcessingFixtureForm
  //           .value as WorkHoldingDevice;
  //         this.dataService
  //           .addWorkHoldingDevice(newFixture)
  //           .subscribe((savedFixture) => {
  //             this.processingFixtures.push(savedFixture);
  //             this.selectProcessingFixture(savedFixture);
  //             this.isNewProcessingFixtureModalOpen = false;
  //             this.newProcessingFixtureForm.reset();
  //           });
  //       }
  //       break;
  //     case 'toolHolder':
  //       this.dataService
  //         .addToolHolder(this.newToolHolder)
  //         .subscribe((newHolder) => {
  //           this.toolHolders.push(newHolder);
  //           this.selectToolHolder(newHolder);
  //           this.isNewToolHolderModalOpen = false;
  //         });
  //       break;
  //     case 'measuringTool':
  //       this.dataService
  //         .addMeasuringTool(this.newMeasuringTool)
  //         .subscribe((newTool) => {
  //           this.measuringTools.push(newTool);
  //           this.selectMeasuringTool(newTool);
  //           this.isNewMeasuringToolModalOpen = false;
  //         });
  //       break;
  //     case 'workStation':
  //       this.dataService
  //         .addWorkStation(this.newWorkStation)
  //         .subscribe((newStation) => {
  //           this.workStations.push(newStation);
  //           this.selectWorkStation(newStation);
  //           this.isNewWorkStationModalOpen = false;
  //         });
  //       break;
  //   }
  // }
  /////////////////////////////////////

  operationForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dataService: NewProjectWizardService
  ) {}

  ngOnInit(): void {
    this.operationForm = this.fb.group({
      fixtures: this.fb.array([]),
      timeComponents: this.fb.array([]),
      normalizationActivities: this.fb.array([]),

      processingFixtures: this.fb.array([]),
      toolHolders: this.fb.array([]),
      measuringTools: this.fb.array([]),
      workStation: this.fb.control(null),
    });

    this.loadResources();
  }

  // Metoda ładowania zasobów
  loadResources(): void {
    this.dataService
      .getWorkHoldingDevices()
      .subscribe(
        (fixtures) => (this.processingFixtures = fixtures.workholdingdevices)
      );
    this.dataService
      .getCuttingTools()
      .subscribe((holders) => (this.toolHolders = holders.cuttingtools));
    this.dataService
      .getMeasuringTools()
      .subscribe((tools) => (this.measuringTools = tools));
    this.dataService
      .getDepartments()
      .subscribe((departments) => (this.departments = departments));
    this.dataService
      .getWorkStations()
      .subscribe((stations) => (this.workStations = stations));
  }

  // Metody zarządzania zasobami processingFixtures
  openProcessingFixturesModal(): void {
    this.isProcessingFixturesModalOpen = true;
  }

  closeProcessingFixturesModal(): void {
    this.isProcessingFixturesModalOpen = false;
  }

  selectProcessingFixture(fixture: WorkHoldingDevice): void {
    const fixtureGroup = this.fb.group({
      // id: [fixture.id],
      name: [fixture.name],
    });

    const processingFixturesArray = this.operationForm.get(
      'processingFixtures'
    ) as FormArray;
    processingFixturesArray.push(fixtureGroup);
    this.closeProcessingFixturesModal();
  }

  removeProcessingFixture(index: number): void {
    const processingFixturesArray = this.operationForm.get(
      'processingFixtures'
    ) as FormArray;
    processingFixturesArray.removeAt(index);
  }

  addNewProcessingFixture(fixture: WorkHoldingDevice): void {
    // // this.dataService.addWorkHoldingDevice(fixture).subscribe((newFixture) => {
    //   this.processingFixtures.push(newFixture);
    //   this.selectProcessingFixture(newFixture);
    // });
  }

  // Analogiczne metody dla pozostałych zasobów
  openToolHoldersModal(): void {
    this.isToolHoldersModalOpen = true;
  }

  closeToolHoldersModal(): void {
    this.isToolHoldersModalOpen = false;
  }

  selectToolHolder(toolHolder: CuttingTool): void {
    const toolHolderGroup = this.fb.group({
      id: [toolHolder.id],
      name: [toolHolder.name],
      type: [toolHolder.type],
    });

    const toolHoldersArray = this.operationForm.get('toolHolders') as FormArray;
    toolHoldersArray.push(toolHolderGroup);
    this.isToolHoldersModalOpen = false;
  }

  removeToolHolder(index: number): void {
    const toolHoldersArray = this.operationForm.get('toolHolders') as FormArray;
    toolHoldersArray.removeAt(index);
  }

  // Metody dla narzędzi pomiarowych
  openMeasuringToolsModal(): void {
    this.isMeasuringToolsModalOpen = true;
  }

  selectMeasuringTool(tool: MeasuringTool): void {
    const toolGroup = this.fb.group({
      id: [tool.id],
      name: [tool.name],
    });

    const measuringToolsArray = this.operationForm.get(
      'measuringTools'
    ) as FormArray;
    measuringToolsArray.push(toolGroup);
    this.isMeasuringToolsModalOpen = false;
  }

  removeMeasuringTool(index: number): void {
    const measuringToolsArray = this.operationForm.get(
      'measuringTools'
    ) as FormArray;
    measuringToolsArray.removeAt(index);
  }

  // Metody dla stanowisk roboczych
  openWorkStationModal(): void {
    this.isWorkStationModalOpen = true;
  }

  selectWorkStation(station: any): void {
    const workStation = this.fb.group({
      id: [station.id],
      name: [station.name],
      departmentId: [station.departmentId],
    });

    this.operationForm.get('workStation')?.setValue(workStation.value);
    this.isWorkStationModalOpen = false;
  }

  openOperationModal(fixtureIndex: number, operationIndex: number): void {
    this.selectedFixtureIndex = fixtureIndex;
    this.selectedOperationIndex = operationIndex;
    this.isModalOpen = true;
  }

  closeOperationModal(): void {
    this.selectedFixtureIndex = null;
    this.selectedOperationIndex = null;
    this.isModalOpen = false;
  }

  get processingFixturesControls(): AbstractControl[] {
    return (this.operationForm.get('processingFixtures') as FormArray).controls;
  }

  get toolHoldersControls(): AbstractControl[] {
    return (this.operationForm.get('toolHolders') as FormArray).controls;
  }

  get measuringToolsControls(): AbstractControl[] {
    return (this.operationForm.get('measuringTools') as FormArray).controls;
  }

  getControlValue(control: AbstractControl | null, field: string): string {
    return control?.get(field)?.value || 'Brak';
  }

  get workStation(): WorkStation | null {
    return this.operationForm.get('workStation')?.value;
  }

  getSelectedOperationDetails() {
    if (
      this.selectedFixtureIndex !== null &&
      this.selectedOperationIndex !== null
    ) {
      const selectedFixture = this.fixtures.at(this.selectedFixtureIndex);
      const machiningOperations = selectedFixture.get(
        'machiningOperations'
      ) as FormArray;
      const selectedOperation = machiningOperations.controls[
        this.selectedOperationIndex
      ] as FormGroup;
      const conditions = selectedOperation.get('conditions') as FormGroup;
      const timeComponents = selectedOperation.get(
        'timeComponents'
      ) as FormArray;

      return {
        selectedFixture,
        machiningOperations,
        selectedOperation,
        conditions,
        timeComponents,
        getTimeComponentControl: (index: number) => {
          const timeControl = timeComponents?.at(index)?.get('time');
          return timeControl instanceof FormControl ? timeControl : null;
        },
      };
    }
    return null;
  }

  getTimeComponentControl(index: number): FormControl {
    if (
      this.selectedFixtureIndex !== null &&
      this.selectedOperationIndex !== null
    ) {
      const fixture = this.fixtures.at(this.selectedFixtureIndex);
      const machiningOperations = fixture.get(
        'machiningOperations'
      ) as FormArray;
      const operation = machiningOperations.at(this.selectedOperationIndex);
      const timeComponents = operation.get('timeComponents') as FormArray;
      const timeComponent = timeComponents.at(index);

      return timeComponent.get('time') as FormControl;
    }
    throw new Error('No operation selected');
  }

  calculateConditions(operationForm: AbstractControl) {
    const conditions = operationForm.get('conditions');
    if (!conditions) return;

    const Dp = conditions.get('Dp')?.value;
    const Dk = conditions.get('Dk')?.value;
    const L = conditions.get('L')?.value;
    const f = conditions.get('f')?.value;
    const Vc = conditions.get('Vc')?.value;
    const tg = conditions.get('tg')?.value;

    // Obliczenie Ap
    if (Dp && Dk) {
      conditions
        .get('Ap')
        ?.setValue(((Dp - Dk) / 2).toFixed(2), { emitEvent: false });
    }

    // Obliczenie obrotów n
    if (Dk && Vc) {
      const n = (1000 * Vc) / (Math.PI * Dk);
      conditions.get('n')?.setValue(n.toFixed(2), { emitEvent: false });
    }

    if (Dk && L && Vc && f) {
      const tg = (L * Dk) / (318 * Vc * f);
      conditions.get('tg')?.setValue(tg.toFixed(3), { emitEvent: false });
    }
  }

  get currentFixture() {
    return this.fixtures.at(this.currentFixtureIndex);
  }

  goToPreviousFixture() {
    if (this.currentFixtureIndex > 0) {
      this.currentFixtureIndex--;
    }
  }

  goToNextFixture() {
    if (this.currentFixtureIndex < this.fixtures.length - 1) {
      this.currentFixtureIndex++;
    }
  }

  get fixtures(): FormArray {
    return this.operationForm.get('fixtures') as FormArray;
  }

  get timeComponents(): FormArray {
    return this.operationForm.get('timeComponents') as FormArray;
  }

  get normalizationActivities(): FormArray {
    return this.operationForm.get('normalizationActivities') as FormArray;
  }

  addFixture(): void {
    const fixtureGroup = this.fb.group({
      image: ['', Validators.required],
      imagePreview: [''],
      machiningOperations: this.fb.array([]),
    });
    this.fixtures.push(fixtureGroup);
    this.currentFixtureIndex = this.fixtures.length - 1;
  }

  removeFixture(index: number): void {
    this.fixtures.removeAt(index);
    this.currentFixtureIndex = Math.max(0, index - 1);
  }

  addMachiningOperation(fixtureIndex: number): void {
    const fixture = this.fixtures.at(fixtureIndex);
    if (!fixture) {
      console.error(`Fixture at index ${fixtureIndex} does not exist.`);
      return;
    }

    const machiningOperations = fixture.get('machiningOperations') as FormArray;
    if (!machiningOperations) {
      console.error(
        `Machining operations array not found for fixture at index ${fixtureIndex}.`
      );
      return;
    }

    // Create time components form array based on defined time components
    const timeComponentsFormArray = this.fb.array(
      this.timeComponents.controls.map(() =>
        this.fb.group({
          description: [''],
          time: ['', [Validators.min(0)]],
        })
      )
    );

    const operationGroup = this.fb.group({
      name: ['', Validators.required],
      conditions: this.fb.group({
        Dp: ['', Validators.required],
        Dk: ['', Validators.required],
        L: ['', Validators.required],
        Ap: ['', Validators.required],
        f: ['', Validators.required],
        Vc: ['', Validators.required],
        n: ['', Validators.required],
        tg: ['', Validators.required],
      }),
      timeComponents: timeComponentsFormArray,
    });

    operationGroup.valueChanges.subscribe(() => {
      this.calculateConditions(operationGroup);
    });

    machiningOperations.push(operationGroup);
  }

  getMachiningOperations(fixture: AbstractControl): FormArray {
    return fixture.get('machiningOperations') as FormArray;
  }

  removeMachiningOperation(fixtureIndex: number, operationIndex: number): void {
    const machiningOperations = this.fixtures
      .at(fixtureIndex)
      .get('machiningOperations') as FormArray;
    machiningOperations.removeAt(operationIndex);
  }

  addTimeComponent(): void {
    const timeComponentGroup = this.fb.group({
      description: ['', Validators.required],
    });
    this.timeComponents.push(timeComponentGroup);

    // Add this time component to existing machining operations
    this.fixtures.controls.forEach((fixture) => {
      const machiningOperations = fixture.get(
        'machiningOperations'
      ) as FormArray;
      if (machiningOperations) {
        machiningOperations.controls.forEach((operation) => {
          const operationTimeComponents = operation.get(
            'timeComponents'
          ) as FormArray;
          operationTimeComponents.push(
            this.fb.group({
              description: [''],
              time: ['', [Validators.min(0)]],
            })
          );
        });
      }
    });
  }

  removeTimeComponent(index: number): void {
    // Remove from time components
    this.timeComponents.removeAt(index);

    // Remove corresponding time components from all machining operations
    this.fixtures.controls.forEach((fixture) => {
      const machiningOperations = fixture.get(
        'machiningOperations'
      ) as FormArray;
      if (machiningOperations) {
        machiningOperations.controls.forEach((operation) => {
          const operationTimeComponents = operation.get(
            'timeComponents'
          ) as FormArray;
          operationTimeComponents.removeAt(index);
        });
      }
    });
  }

  addNormalizationActivity(): void {
    const normalizationActivityGroup = this.fb.group({
      description: ['', Validators.required],
      time: ['', [Validators.required, Validators.min(0)]],
    });
    this.normalizationActivities.push(normalizationActivityGroup);
  }

  removeNormalizationActivity(index: number): void {
    this.normalizationActivities.removeAt(index);
  }

  handleImageUpload(event: Event, fixtureIndex: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const fixtures = this.fixtures;
        fixtures.at(fixtureIndex).patchValue({ imagePreview: reader.result });
      };
      reader.readAsDataURL(file);
    }
  }

  submit(): void {
    if (this.operationForm.valid) {
      console.log(this.operationForm.value);
    }
  }
}
