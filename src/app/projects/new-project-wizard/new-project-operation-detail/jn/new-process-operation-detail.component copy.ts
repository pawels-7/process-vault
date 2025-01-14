import {
  Component,
  inject,
  output,
  input,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NewProcessWizardService } from '../../../../processes/new-process-wizard/new-process-operation-detail/new-process-wizard.service';

@Component({
  selector: 'app-new-process-operation-detail',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './new-process-operation-detail.component.html',
  styleUrl: './new-process-operation-detail.component.scss',
})
export class NewProjectOperationDetailComponent implements OnInit {
  processIndex = input.required<number>();
  operationIndex = input.required<number>();
  next = output();
  previous = output();
  currentFixtureIndex = 0;

  selectedTaskIndex: number | null = null;
  selectedTask: FormGroup | null = null;

  private dataService = inject(NewProcessWizardService);
  private cdr = inject(ChangeDetectorRef);

  form: FormGroup;

  constructor() {
    this.form = new FormGroup({
      fixtures: new FormArray([]),
    });
  }

  ngOnInit() {
    const operation =
      this.dataService.getProjectData().processes[this.processIndex()]
        .operations[this.operationIndex()];

    const fixtures = operation?.fixtures || [];

    this.form = new FormGroup({
      fixtures: new FormArray(
        fixtures.map((fixture) => {
          return new FormGroup({
            drawing: new FormControl(fixture.drawing, [Validators.required]),
            tasks: new FormArray(
              fixture.tasks.map((task) => this.createTaskForm(task))
            ),
          });
        })
      ),
    });

    this.drawingPreviews = fixtures.map((fixture) => fixture.drawing || null);
  }

  createTaskForm(task: any = {}) {
    const formGroup = new FormGroup({
      name: new FormControl(task.name || '', [Validators.required]),
      D_p: new FormControl(task.D_p || null, [Validators.required]),
      D_k: new FormControl(task.D_k || null, [Validators.required]),
      L: new FormControl(task.L || null, [Validators.required]),
      A_p: new FormControl(task.A_p || null), // Automatyczne obliczenie
      f: new FormControl(task.f || null, [Validators.required]),
      V_c: new FormControl(task.V_c || null, [Validators.required]),
      n: new FormControl(task.n || null), // Automatyczne obliczenie
      t_g: new FormControl(task.t_g || null), // Automatyczne obliczenie
    });

    // Subskrypcja zmian
    ['D_p', 'D_k', 'L', 'f', 'V_c'].forEach((field) =>
      formGroup.get(field)?.valueChanges.subscribe(() => {
        this.calculateConditions(formGroup);
      })
    );

    return formGroup;
  }

  calculateConditions(taskForm: FormGroup) {
    const D_p = taskForm.get('D_p')?.value;
    const D_k = taskForm.get('D_k')?.value;
    const L = taskForm.get('L')?.value;
    const f = taskForm.get('f')?.value;
    const V_c = taskForm.get('V_c')?.value;

    if (D_p && D_k) {
      taskForm
        .get('A_p')
        ?.setValue(((D_p - D_k) / 2).toFixed(2), { emitEvent: false });
    }

    if (D_k && V_c) {
      const n = (1000 * V_c) / (Math.PI * D_k);
      taskForm.get('n')?.setValue(n.toFixed(2), { emitEvent: false });
    }

    if (D_k && L && V_c && f) {
      const t_g = (L * D_k) / (318 * V_c * f);
      taskForm.get('t_g')?.setValue(t_g.toFixed(3), { emitEvent: false });
    }
  }

  get fixtures(): FormArray {
    return this.form.get('fixtures') as FormArray;
  }

  get currentFixture(): FormGroup {
    return this.fixtures.at(this.currentFixtureIndex) as FormGroup;
  }

  get tasks(): FormArray {
    return this.currentFixture?.get('tasks') as FormArray;
  }

  addTask() {
    if (this.tasks) {
      this.tasks.push(this.createTaskForm());
    }
  }

  deleteTask(index: number) {
    if (this.tasks) {
      this.tasks.removeAt(index);
    }
  }

  addFixture() {
    this.fixtures.push(
      new FormGroup({
        drawing: new FormControl('', [Validators.required]),
        tasks: new FormArray([]),
      })
    );
    this.drawingPreviews.push(null);
    this.currentFixtureIndex = this.fixtures.length - 1;
  }

  // Add this method to the NewProcessOperationDetailComponent class
  deleteFixture() {
    if (
      this.currentFixtureIndex >= 0 &&
      this.currentFixtureIndex < this.fixtures.length
    ) {
      this.fixtures.removeAt(this.currentFixtureIndex);
      this.drawingPreviews.splice(this.currentFixtureIndex, 1);
      if (this.currentFixtureIndex > 0) {
        this.currentFixtureIndex -= 1;
      }
      this.cdr.markForCheck();
    }
  }

  previousFixture() {
    if (this.currentFixtureIndex > 0) {
      this.currentFixtureIndex -= 1;
      this.cdr.markForCheck();
    }
  }

  nextFixture() {
    if (this.currentFixtureIndex < this.fixtures.length - 1) {
      this.currentFixtureIndex += 1;
    }
  }

  submit() {
    if (this.form.valid) {
      this.dataService.setProjectData({
        processes: (this.dataService.getProjectData().processes[
          this.processIndex()
        ].operations[this.operationIndex()].fixtures =
          this.form.value.fixtures),
      });
      this.next.emit();
    }
  }

  drawingPreviews: (string | ArrayBuffer | null)[] = [];

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const fileReader = new FileReader();

    fileReader.onload = () => {
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        this.drawingPreviews[this.currentFixtureIndex] = fileReader.result;
      }
    };

    fileReader.readAsDataURL(file);
  }

  showModal = false;

  editConditions(index: number) {
    this.selectedTaskIndex = index;
    this.selectedTask = this.tasks.at(index) as FormGroup;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedTaskIndex = null;
    this.selectedTask = null;
  }
}
