import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { Vehicle } from "../../../core/models/vehicle.model";

@Component({
  selector: "app-vehicle-card",
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  template: `
    <div
      class="vehicle-card"
      [class.online]="vehicle.status === 'online'"
      [class.idle]="vehicle.status === 'idle'"
    >
      <!-- Status indicator bar -->
      <div
        class="status-bar"
        [style.background]="statusColor(vehicle.status)"
      ></div>

      <div class="card-content">
        <!-- Left: icon + id -->
        <div class="vehicle-icon-section">
          <div class="vehicle-emoji">{{ typeEmoji(vehicle.type) }}</div>
          <div class="status-badge" [style.--c]="statusColor(vehicle.status)">
            <span class="badge-dot"></span>
            {{ vehicle.status | uppercase }}
          </div>
        </div>

        <!-- Middle: info -->
        <div class="vehicle-info">
          <div class="vehicle-id">{{ vehicle.vehicleId }}</div>
          <div class="vehicle-name">{{ vehicle.name }}</div>
          <div class="driver-name" *ngIf="vehicle.driver?.name">
            <mat-icon>person</mat-icon> {{ vehicle.driver!.name }}
          </div>
        </div>

        <!-- Right: telemetry -->
        <div class="vehicle-telemetry" *ngIf="vehicle.lastLocation">
          <div class="telem-item">
            <mat-icon>speed</mat-icon>
            <span>{{ vehicle.lastLocation.speed | number: "1.0-0" }} km/h</span>
          </div>
          <div class="telem-item">
            <mat-icon>navigation</mat-icon>
            <span>{{ vehicle.lastLocation.heading | number: "1.0-0" }}°</span>
          </div>
          <div class="telem-item">
            <mat-icon>route</mat-icon>
            <span>{{ vehicle.todayDistance | number: "1.1-1" }} km</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .vehicle-card {
        background: #0f1117;
        border: 1px solid #1e2d45;
        border-radius: 10px;
        overflow: hidden;
        display: flex;
        transition:
          border-color 0.15s,
          background 0.15s;
        position: relative;

        &.online {
          border-color: rgba(34, 197, 94, 0.2);
          &:hover {
            border-color: rgba(34, 197, 94, 0.4);
          }
        }

        &.idle {
          border-color: rgba(245, 158, 11, 0.2);
          &:hover {
            border-color: rgba(245, 158, 11, 0.4);
          }
        }
      }

      .status-bar {
        width: 3px;
        flex-shrink: 0;
      }

      .card-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        flex: 1;
      }

      /* ── Icon Section ── */
      .vehicle-icon-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        min-width: 40px;
      }

      .vehicle-emoji {
        font-size: 22px;
        line-height: 1;
      }

      .status-badge {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 9px;
        font-weight: 700;
        color: var(--c, #64748b);
        letter-spacing: 0.5px;
      }

      .badge-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--c, #64748b);
      }

      /* ── Info ── */
      .vehicle-info {
        flex: 1;
        min-width: 0;
      }

      .vehicle-id {
        font-size: 13px;
        font-weight: 700;
        color: #f1f5f9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .vehicle-name {
        font-size: 11px;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .driver-name {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 11px;
        color: #475569;
        margin-top: 3px;

        mat-icon {
          font-size: 11px;
          width: 11px;
          height: 11px;
        }
      }

      /* ── Telemetry ── */
      .vehicle-telemetry {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 80px;
      }

      .telem-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: #94a3b8;
        font-variant-numeric: tabular-nums;

        mat-icon {
          font-size: 13px;
          width: 13px;
          height: 13px;
          color: #475569;
        }
      }
    `,
  ],
})
export class VehicleCardComponent {
  @Input() vehicle!: Vehicle;

  statusColor(status: string): string {
    switch (status) {
      case "online":
        return "#22c55e";
      case "idle":
        return "#f59e0b";
      case "offline":
        return "#ef4444";
      case "maintenance":
        return "#8b5cf6";
      default:
        return "#64748b";
    }
  }

  typeEmoji(type: string): string {
    switch (type) {
      case "truck":
        return "🚚";
      case "van":
        return "🚐";
      case "car":
        return "🚗";
      case "bus":
        return "🚌";
      case "motorcycle":
        return "🏍️";
      default:
        return "🚗";
    }
  }
}
