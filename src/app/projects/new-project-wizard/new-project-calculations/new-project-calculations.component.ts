import { Component, inject, output } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NewProjectWizardService } from '../new-project-wizard.service';
import { DecimalPipe } from '@angular/common';
import {
  findAllowancesEntry,
  findAllowancesEntryZgr,
  findClosestGreaterDiameter,
  findDeviation,
  findShaftTolerance,
} from './tables';

@Component({
  selector: 'app-new-project-calculations',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './new-project-calculations.component.html',
  styleUrl: './new-project-calculations.component.scss',
})
export class NewProjectCalculationsComponent {
  next = output();
  previous = output();

  private dataService = inject(NewProjectWizardService);

  // Wyniki obliczeń
  smuklosc: number = 0;
  v_po: number = 0; // Objętość wałka
  v_pf: number = 0; // Objętość półfabrykatu
  o: number = 0; // Współczynnik zmiany objętości
  m_po: number = 0; // Masa wałka
  m_pf: number = 0; // Masa półfabrykatu
  m_w: number = 0; // Masa wiórów
  l_sum: number = 0;
  d_max: number = 0;
  rho = 7.85;
  d_avg = 0;
  q_zgr = 0;
  q_kszt = 0;
  q_wyk = 0;
  total_allowances = 0;
  minBlankDiameter = 0;
  chosenBlankDiameter = 0;
  q_pl = 0;
  blankLengthAfterCut = 0;

  shaftLevels: {
    d: number;
    l: number;
    t_po: number;
    t_pf: number;
    k_0: number;
    IZ: number;
    zgr: number;
    kszt: number;
    wyk: number;
  }[] = [];

  form: FormGroup;

  constructor() {
    // const project = this.dataService.getProjectData();
    this.form = new FormGroup({
      precision: new FormControl(1, [Validators.required]),
      levels_number: new FormControl(0, [Validators.required]),
      levels: new FormArray([]),
    });
  }

  get levels(): FormArray {
    return this.form.get('levels') as FormArray;
  }

  onLevelsChange() {
    this.levels.clear();
    const levelsNumber = this.form.value.levels_number || 0;
    const currentLength = this.levels.length;

    if (levelsNumber > currentLength) {
      for (let i = currentLength; i < levelsNumber; i++) {
        this.levels.push(
          new FormGroup({
            d: new FormControl(0, [Validators.required]),
            l: new FormControl(0, [Validators.required]),
            t: new FormControl('g5', [Validators.required]),
          })
        );
      }
    } else if (levelsNumber < currentLength) {
      this.levels.removeAt(levelsNumber);
    }
  }

  calculateResults(): void {
    const levels = this.levels.value;
    const n = levels.length;

    let l_sum = 0; // Suma długości
    let v_po = 0; // Objętość wałka
    let d_max = 0; // Największa średnica
    let d_temp = 0;

    this.shaftLevels = [];
    // Iteracja przez stopnie
    levels.forEach((level: any) => {
      const d = level.d / 100; // Średnica [dm]
      const l = level.l / 100; // Długość [dm]

      if (d > d_max) d_max = d;

      l_sum += l;
      v_po += (Math.PI * l * d * d) / 4; // Objętość wałka

      ////////
      d_temp += d * l;

      const precision = this.form.value.precision;
      const deviation = findDeviation(level.d, precision);
      const tolerance = findShaftTolerance(level.d, level.t);
      const t_pf = deviation! * 2 * 1000;
      const t_po = tolerance?.upperDeviation! - tolerance?.lowerDeviation!;
      const k_0 = t_pf / t_po;
      let IZ = 1;
      if (k_0 > 10 && k_0 < 50) {
        IZ = 2;
      } else if (k_0 > 50) {
        IZ = 3;
      }
      this.shaftLevels.push({
        d: level.d,
        l: level.l,
        t_pf,
        t_po,
        k_0,
        IZ,
        zgr: 0,
        kszt: 0,
        wyk: 0,
      });
      console.log('deviation', deviation, this.shaftLevels);
    });

    const v_pf = (Math.PI * l_sum * d_max * d_max) / 4; // Objętość półfabrykatu
    const o = ((v_pf - v_po) / v_pf) * 100; // Współczynnik zmiany objętości
    const m_po = this.rho * v_po; // Masa wałka
    const m_pf = this.rho * v_pf; // Masa półfabrykatu
    const m_w = m_pf - m_po; // Masa wiórów

    // Aktualizacja zmiennych
    this.smuklosc = d_max ? l_sum / d_max : 0;
    this.v_po = v_po;
    this.v_pf = v_pf;
    this.o = o;
    this.m_po = m_po;
    this.m_pf = m_pf;
    this.m_w = m_w;
    this.l_sum = l_sum * 100;
    this.d_max = d_max * 100;
    this.d_avg = (d_temp / l_sum) * 100;
    this.q_zgr = findAllowancesEntryZgr(this.d_avg, this.l_sum) || 1.6;
    this.q_kszt = findAllowancesEntryZgr(this.d_avg, this.l_sum) || 0.4;
    this.q_wyk = findAllowancesEntryZgr(this.d_avg, this.l_sum) || 0.21;

    let maxDiameterLevelIndex = levels.findIndex(
      (level: any) => level.d === this.d_max
    );
    this.total_allowances = this.q_zgr;
    if (this.shaftLevels[maxDiameterLevelIndex]?.IZ === 2) {
      this.total_allowances += this.q_kszt;
    }
    if (this.shaftLevels[maxDiameterLevelIndex]?.IZ === 3) {
      this.total_allowances += this.q_wyk;
    }
    this.q_kszt + this.q_wyk;
    this.minBlankDiameter = this.d_max + this.total_allowances;
    this.chosenBlankDiameter = findClosestGreaterDiameter(
      this.minBlankDiameter
    )!;

    const q_plzgr = 1.9;
    const q_plkszt = 1.1;
    this.q_pl = q_plzgr + q_plkszt;
    this.blankLengthAfterCut = l_sum + 2 * this.q_pl;
    this.shaftLevels.forEach((level) => {
      level.zgr = this.q_zgr;
      if (level.IZ === 2) {
        level.kszt = this.q_kszt;
      }
      if (level.IZ === 3) {
        level.wyk = this.q_wyk;
      }
    });
  }

  ceil(number: number, precision: number) {
    return Math.ceil(number * 10 ** precision) / 10 ** precision;
  }

  submit() {
    console.log(this.form.value);
  }
}
