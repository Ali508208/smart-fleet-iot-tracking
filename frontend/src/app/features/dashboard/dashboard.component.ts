import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatChipsModule } from "@angular/material/chips";
import { forkJoin, interval, Subscription } from "rxjs";
import { switchMap, startWith } from "rxjs/operators";

import { ApiService } from "../../core/services/api.service";
import { SocketService } from "../../core/services/socket.service";
import {
  FleetStats,
  Vehicle,
  FleetAlert,
} from "../../core/models/vehicle.model";
import { StatsCardComponent } from "../../shared/components/stats-card/stats-card.component";
import { VehicleCardComponent } from "../../shared/components/vehicle-card/vehicle-card.component";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    StatsCardComponent,
    VehicleCardComponent,
  ],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: FleetStats | null = null;
  vehicles: Vehicle[] = [];
  alerts: FleetAlert[] = [];
  loading = true;
  lastUpdated = new Date();

  private subs: Subscription[] = [];

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    this.loadData();

    // Refresh stats every 30 seconds
    this.subs.push(
      interval(30000)
        .pipe(
          startWith(0),
          switchMap(() => this.apiService.getFleetStats()),
        )
        .subscribe({
          next: (s) => {
            this.stats = s;
            this.lastUpdated = new Date();
          },
        }),
    );

    // Listen for real-time vehicle status changes
    this.subs.push(
      this.socketService.vehicleStatus$.subscribe((update) => {
        const vehicle = this.vehicles.find(
          (v) => v.vehicleId === update.vehicleId,
        );
        if (vehicle) vehicle.status = update.status as Vehicle["status"];
      }),
    );

    // Listen for alerts
    this.subs.push(
      this.socketService.alerts$.subscribe((alert) => {
        this.alerts.unshift(alert);
        if (this.alerts.length > 20) this.alerts.pop();
      }),
    );

    // Listen for location updates to update last location
    this.subs.push(
      this.socketService.locationUpdates$.subscribe((update) => {
        const vehicle = this.vehicles.find(
          (v) => v.vehicleId === update.vehicleId,
        );
        if (vehicle) {
          vehicle.status = update.status as Vehicle["status"];
          vehicle.lastLocation = {
            latitude: update.latitude,
            longitude: update.longitude,
            speed: update.speed,
            heading: update.heading,
            timestamp: update.timestamp,
          };
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      vehicles: this.apiService.getVehicles(),
      stats: this.apiService.getFleetStats(),
    }).subscribe({
      next: ({ vehicles, stats }) => {
        this.vehicles = vehicles;
        this.stats = stats;
        this.loading = false;
        this.lastUpdated = new Date();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getActiveVehicles(): Vehicle[] {
    return this.vehicles.filter(
      (v) => v.status === "online" || v.status === "idle",
    );
  }

  getOfflineVehicles(): Vehicle[] {
    return this.vehicles.filter(
      (v) => v.status === "offline" || v.status === "maintenance",
    );
  }

  getAlertClass(type: string): string {
    if (type.includes("ENTER")) return "alert-enter";
    if (type.includes("EXIT")) return "alert-exit";
    return "alert-info";
  }

  clearAlerts(): void {
    this.alerts = [];
  }
}
