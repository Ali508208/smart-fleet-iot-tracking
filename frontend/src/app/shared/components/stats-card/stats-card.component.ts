import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "app-stats-card",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="stats-card" [style.--accent]="color">
      <div class="card-left">
        <div class="card-icon">
          <mat-icon>{{ icon }}</mat-icon>
        </div>
      </div>
      <div class="card-right">
        <div class="card-value">
          {{ value }}<span class="card-unit" *ngIf="unit"> {{ unit }}</span>
        </div>
        <div class="card-label">{{ label }}</div>
        <div class="card-subtitle" *ngIf="subtitle">{{ subtitle }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .stats-card {
        background: #161b27;
        border: 1px solid #1e2d45;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        gap: 14px;
        align-items: center;
        transition:
          border-color 0.2s,
          transform 0.2s;
        position: relative;
        overflow: hidden;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: var(--accent, #3b82f6);
          border-radius: 2px 0 0 2px;
        }

        &:hover {
          border-color: rgba(var(--accent-rgb, 59 130 246) / 0.4);
          transform: translateY(-1px);
        }
      }

      .card-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: rgba(var(--accent-rgb, 59 130 246) / 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          color: var(--accent, #3b82f6);
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      .card-right {
        flex: 1;
        min-width: 0;
      }

      .card-value {
        font-size: 26px;
        font-weight: 700;
        color: #f1f5f9;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }

      .card-unit {
        font-size: 13px;
        font-weight: 400;
        color: #64748b;
      }

      .card-label {
        font-size: 13px;
        color: #94a3b8;
        margin-top: 4px;
        font-weight: 500;
      }

      .card-subtitle {
        font-size: 11px;
        color: #475569;
        margin-top: 2px;
      }
    `,
  ],
})
export class StatsCardComponent {
  @Input() label = "";
  @Input() value: string | number | null = 0;
  @Input() unit = "";
  @Input() icon = "info";
  @Input() color = "#3b82f6";
  @Input() subtitle = "";
}
