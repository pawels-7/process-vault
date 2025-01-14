import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Project } from '../../project/project.model';
import { NewProjectWizardService } from '../new-project-wizard.service';

@Component({
  selector: 'app-new-project-basic',
  templateUrl: './new-project-basic.component.html',
  styleUrls: ['./new-project-basic.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule],
})
export class NewProjectBasicComponent implements OnInit {
  projectForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private projectService: NewProjectWizardService
  ) {
    this.projectForm = this.fb.group({
      productName: ['', Validators.required],
      partName: ['', Validators.required],
      unitsPerProduct: [0, [Validators.required, Validators.min(0)]],
      unitsInOrder: [0, [Validators.required, Validators.min(0)]],
      unitsPerBatch: [0, [Validators.required, Validators.min(0)]],
      completionDate: ['', Validators.required],
      material: ['', Validators.required],
      unitMass: [0, [Validators.required, Validators.min(0)]],
      materialStandard: [0, [Validators.required, Validators.min(0)]],
      materialCost: [0, [Validators.required, Validators.min(0)]],
    });
  }

  saveData(): void {
    const updatedProject: Project = {
      ...this.projectService.getProject(),
      productName: this.projectForm.value.productName,
      partName: this.projectForm.value.partName,
      unitsPerProduct: this.projectForm.value.unitsPerProduct,
      order: {
        ...this.projectService.getProject().order,
        unitsInOrder: this.projectForm.value.unitsInOrder,
        unitsPerBatch: this.projectForm.value.unitsPerBatch,
        completionDate: this.projectForm.value.completionDate,
      },
      material: this.projectForm.value.material,
      unitMass: this.projectForm.value.unitMass,
      materialStandard: this.projectForm.value.materialStandard,
      materialCost: this.projectForm.value.materialCost,
    };
    this.projectService.setCurrentProject(updatedProject);
  }

  ngOnInit(): void {
    // Pobierz dane projektu, jeśli istnieją
    const currentProject = this.projectService.getProject();
    if (currentProject) {
      this.projectForm.patchValue({
        productName: currentProject.productName,
        partName: currentProject.partName,
        unitsPerProduct: currentProject.unitsPerProduct,
        unitsInOrder: currentProject.order.unitsInOrder,
        unitsPerBatch: currentProject.order.unitsPerBatch,
        completionDate: currentProject.order.completionDate,
        material: currentProject.material,
        unitMass: currentProject.unitMass,
        materialStandard: currentProject.materialStandard,
        materialCost: currentProject.materialCost,
      });
    }
  }
}
