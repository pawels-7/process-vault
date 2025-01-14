import {
  HostListener,
  Component,
  ViewEncapsulation,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

interface Position {
  x: number;
  y: number;
}

interface Operation {
  id: number;
  name: string;
  next: number[];
}

// interface Phase {
//   rows;
// }

interface Diagram {
  blanks: Operation[];
  phases: Operation[][][];
}

@Component({
  selector: 'app-new-process-structure',
  standalone: true,
  imports: [DragDropModule],
  templateUrl: './new-process-structure.component.html',
  styleUrl: './new-process-structure.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class NewProcessStructureComponent {
  private cdr = inject(ChangeDetectorRef);
  selectedCircles: string[] = [];

  phase0: Operation[] = [];
  phase1: Operation[] = [];
  phase2: Operation[] = [];
  phase3: Operation[] = [];
  phase4: Operation[] = [];
  phase5: Operation[] = [];
  phase6: Operation[] = [];
  phase7: Operation[] = [];
  phase8: Operation[] = [];
  phase9: Operation[] = [];

  blanks: Operation[] = [{ id: 0, name: 'PF1', next: [1] }];
  phases: Operation[][] = [
    this.phase0,
    this.phase1,
    this.phase2,
    this.phase3,
    this.phase4,
    this.phase5,
    this.phase6,
    this.phase7,
    this.phase8,
    this.phase9,
  ];

  zabiegi_obrobkowe: Operation[] = [
    { id: 1, name: 'normalizować', next: [] },
    { id: 2, name: 'piaskować', next: [] },
    { id: 3, name: 'ciąć', next: [] },
    { id: 4, name: 'frezować zgrubnie powierzchnie czołowe', next: [] },
    { id: 5, name: 'frezować Średniodokładnie powierzchnie', next: [] },
    { id: 6, name: 'frezować zgrubnie kształt zewnętrzny (pręt)', next: [] },
    { id: 7, name: 'frezować Średniodoktadnie R 10', next: [] },
    { id: 8, name: 'wiercić otwór (020H7)', next: [] },
    { id: 9, name: 'powiercać otwór 020H7)', next: [] },
    { id: 10, name: 'rozwiercać zgrubnie otwór (020H7)', next: [] },
    { id: 11, name: 'rozwiercać wykańczająco otwór (ô20H7)', next: [] },
    { id: 12, name: 'fazowac otwór (020H7)', next: [] },
    { id: 13, name: 'wiercić otwór (M6)', next: [] },
    { id: 14, name: 'gwintować otwór (M6)', next: [] },
    { id: 15, name: 'fazować otwór (M6)', next: [] },
    { id: 16, name: 'przeciągać rowek wpustowy', next: [] },
    { id: 17, name: 'dłutować rowek wpustowy', next: [] },
    { id: 18, name: 'hartować indukcyjne powierzchnie RI O', next: [] },
    { id: 19, name: 'stępić ostre krawędzie', next: [] },
    { id: 20, name: 'kontrola techniczna', next: [] },
  ];

  @HostListener('window:resize')
  onResize() {
    const lines = document.querySelectorAll(
      'line'
    ) as NodeListOf<SVGLineElement>;

    // Clear all lines
    lines.forEach((line) => {
      line.remove();
    });

    this.blanks.forEach((blank) => {
      this.drawArrow('circle0', 'circle' + blank.id.toString());
    });

    this.phases.forEach((phase) => {
      phase.forEach((operation) => {
        operation.next.forEach((next) => {
          console.log(
            `Rysuję strzałkę między: circle${operation.id} a circle${next}`
          );
          this.drawArrow(
            'circle' + operation.id.toString(),
            'circle' + next.toString()
          );
        });
      });
    });
  }

  drop(event: CdkDragDrop<Operation[]>) {
    if (event.previousContainer === event.container) {
      // Reorder items within the same list
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Move items between lists
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    this.cdr.detectChanges();

    this.onResize();
  }

  ngAfterViewInit() {
    // this.phases.blanks.forEach((blank) => {
    //   this.drawArrow('circle' + blank.id.toString(), 'circle' + blank.next[0]);
    // });

    this.blanks.forEach((blank) => {
      this.drawArrow('circle0', 'circle' + blank.id.toString());
    });

    this.phases.forEach((phase) => {
      phase.forEach((operation) => {
        operation.next.forEach((next) => {
          this.drawArrow(
            'circle' + operation.id.toString(),
            'circle' + next.toString()
          );
        });
      });
    });
  }

  onAddCircle(phase: number) {
    console.log(phase);
    const id = this.phases[phase][0].id + 1 || 1;
    this.phases[0] = [
      {
        id: id,
        name: id.toString(),
        next: [],
      },
    ];
  }

  updateNext(startId: number, endId: number) {
    // Szukamy operacji w fazach, która ma `startId`
    this.phases.forEach((phase) => {
      const operation = phase.find((op) => op.id === startId);
      if (operation) {
        // Dodajemy id następnej operacji (jeśli już go nie ma)
        if (!operation.next.includes(endId)) {
          operation.next.push(endId);
          console.log(`Dodano połączenie: ${startId} -> ${endId}`);
        }
      }
    });
  }

  onCircleClick(circle: HTMLDivElement) {
    if (circle.classList.contains('selected')) {
      circle.classList.remove('selected');
      this.selectedCircles = this.selectedCircles.filter(
        (c) => c !== circle.id
      );
      return;
    }

    if (this.selectedCircles.length < 2) {
      circle.classList.add('selected');
      this.selectedCircles.push(circle.id);

      if (this.selectedCircles.length === 2) {
        const startId = this.selectedCircles[0].replace('circle', ''); // Usuń prefix 'circle'
        const endId = this.selectedCircles[1].replace('circle', ''); // Usuń prefix 'circle'

        this.drawArrow(this.selectedCircles[0], this.selectedCircles[1]);

        this.updateNext(parseInt(startId, 10), parseInt(endId, 10));

        this.clearSelection();
      }
    }
  }

  // Function to get the position of a circle relative to the container
  getCirclePosition(circleId: string): Position {
    const circle = document.getElementById(circleId) as HTMLDivElement;

    if (!circle) {
      throw new Error(`Circle with ID ${circleId} not found`);
    }

    const rect = circle.getBoundingClientRect();

    // Get container's position
    const containerRect = (
      document.getElementById('svg-container') as HTMLDivElement
    ).getBoundingClientRect();

    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top,
    };
  }

  // Function to draw an arrow between two circles
  drawArrow(startId: string, endId: string) {
    const startPos = this.getCirclePosition(startId);
    const endPos = this.getCirclePosition(endId);

    console.log(`Start (${startId}): `, startPos);
    console.log(`End (${endId}): `, endPos);

    const arrow = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line'
    );

    if (startPos.x < endPos.x) {
      // if (startPos.x < endPos.x && startPos.y < endPos.y) {
      //   console.log('1');
      //   arrow.setAttribute('x1', startPos.x.toString() + 10);
      //   arrow.setAttribute('y1', startPos.y.toString() + 10);
      //   arrow.setAttribute('x2', (endPos.x - 10).toString());
      //   arrow.setAttribute('y2', (endPos.y - 10).toString());
      // } else if (startPos.x < endPos.x && startPos.y > endPos.y) {
      //   console.log('2');
      //   arrow.setAttribute('x1', (startPos.x + 10).toString());
      //   arrow.setAttribute('y1', (startPos.y - 10).toString());
      //   arrow.setAttribute('x2', (endPos.x - 10).toString());
      //   arrow.setAttribute('y2', (endPos.y + 10).toString());
      // } else {
      console.log('3');
      arrow.setAttribute('x1', (startPos.x + 15).toString());
      arrow.setAttribute('y1', startPos.y.toString());
      arrow.setAttribute('x2', (endPos.x - 15).toString());
      arrow.setAttribute('y2', endPos.y.toString());
      // }
    } else if (startPos.x > endPos.x) {
      if (startPos.x > endPos.x && startPos.y < endPos.y) {
        console.log('4');
        arrow.setAttribute('x1', (startPos.x - 10).toString());
        arrow.setAttribute('y1', (startPos.y + 10).toString());
        arrow.setAttribute('x2', (endPos.x + 10).toString());
        arrow.setAttribute('y2', (endPos.y - 10).toString());
      } else if (startPos.x > endPos.x && startPos.y > endPos.y) {
        console.log('5');
        arrow.setAttribute('x1', (startPos.x - 10).toString());
        arrow.setAttribute('y1', (startPos.y - 10).toString());
        arrow.setAttribute('x2', (endPos.x + 10).toString());
        arrow.setAttribute('y2', (endPos.y + 10).toString());
      } else {
        console.log('6');
        arrow.setAttribute('x1', (startPos.x - 15).toString());
        arrow.setAttribute('y1', startPos.y.toString());
        arrow.setAttribute('x2', (endPos.x + 15).toString());
        arrow.setAttribute('y2', endPos.y.toString());
      }
    } else if (startPos.y < endPos.y) {
      console.log('7');
      arrow.setAttribute('x1', startPos.x.toString());
      arrow.setAttribute('y1', (startPos.y + 15).toString());
      arrow.setAttribute('x2', endPos.x.toString());
      arrow.setAttribute('y2', (endPos.y - 15).toString());
    } else if (startPos.y > endPos.y) {
      console.log('8');
      arrow.setAttribute('x1', startPos.x.toString());
      arrow.setAttribute('y1', (startPos.y - 15).toString());
      arrow.setAttribute('x2', endPos.x.toString());
      arrow.setAttribute('y2', (endPos.y + 15).toString());
    }
    arrow.classList.add('arrow');

    const svgElement = document.getElementById('svg') as unknown as SVGElement;
    svgElement.appendChild(arrow);
    console.log('Strzałka dodana: ', arrow);
  }

  clearSelection() {
    this.selectedCircles = [];
    document.querySelectorAll<HTMLDivElement>('.circle').forEach((circle) => {
      circle.classList.remove('selected');
    });
  }
}
