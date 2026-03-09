import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatTableModule } from "@angular/material/table";
import { MatChipsModule } from "@angular/material/chips";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Subscription } from "rxjs";

import { ApiService } from "../../core/services/api.service";
import { SocketService } from "../../core/services/socket.service";
import { Vehicle, VehicleAnalytics } from "../../core/models/vehicle.model";

@Component({
  selector: "app-vehicles",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTableModule,
    MatChipsModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: "./vehicles.component.html",
  styleUrls: ["./vehicles.component.scss"],
})
export class VehiclesComponent implements OnInit, OnDestroy {
  vehicles: Vehicle[] = [];
  loading = true;
  showAddForm = false;
  selectedVehicle: Vehicle | null = null;
  analytics: VehicleAnalytics | null = null;
  analyticsLoading = false;

  addForm: FormGroup;
  displayedColumns = [
    "vehicleId",
    "name",
    "type",
    "driver",
    "status",
    "speed",
    "distance",
    "actions",
  ];

  private subs: Subscription[] = [];

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.addForm = this.fb.group({
      vehicleId: [
        "",
        [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/i)],
      ],
      name: ["", Validators.required],
      type: ["truck", Validators.required],
      driverName: [""],
      driverPhone: [""],
      make: [""],
      model: [""],
      year: [""],
      fuelEfficiency: [12],
    });
  }

  ngOnInit(): void {
    this.loadVehicles();

    this.subs.push(
      this.socketService.locationUpdates$.subscribe((update) => {
        const v = this.vehicles.find((x) => x.vehicleId === update.vehicleId);
        if (v) {
          v.status = update.status as Vehicle["status"];
          v.lastLocation = {
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

  loadVehicles(): void {
    this.loading = true;
    this.apiService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open("Failed to load vehicles", "Close", {
          duration: 3000,
        });
      },
    });
  }

  addVehicle(): void {
    if (this.addForm.invalid) return;
    const v = this.addForm.value;
    const payload: Partial<Vehicle> = {
      vehicleId: v.vehicleId.toUpperCase(),
      name: v.name,
      type: v.type,
      driver: { name: v.driverName, phone: v.driverPhone },
      specs: {
        make: v.make,
        model: v.model,
        year: v.year ? parseInt(v.year) : undefined,
        fuelEfficiency: v.fuelEfficiency,
      },
    };
    this.apiService.createVehicle(payload).subscribe({
      next: (vehicle) => {
        this.vehicles.unshift(vehicle);
        this.addForm.reset({ type: "truck", fuelEfficiency: 12 });
        this.showAddForm = false;
        this.snackBar.open("Vehicle registered successfully", "Close", {
          duration: 3000,
        });
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || "Failed to create vehicle",
          "Close",
          { duration: 3000 },
        );
      },
    });
  }

  deleteVehicle(vehicleId: string): void {
    if (
      !confirm(
        `Delete vehicle ${vehicleId}? This will also remove all location history.`,
      )
    )
      return;
    this.apiService.deleteVehicle(vehicleId).subscribe({
      next: () => {
        this.vehicles = this.vehicles.filter((v) => v.vehicleId !== vehicleId);
        if (this.selectedVehicle?.vehicleId === vehicleId)
          this.selectedVehicle = null;
        this.snackBar.open("Vehicle deleted", "Close", { duration: 3000 });
      },
    });
  }

  selectVehicle(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.loadAnalytics(vehicle.vehicleId);
  }

  loadAnalytics(vehicleId: string): void {
    this.analyticsLoading = true;
    this.analytics = null;
    this.apiService.getVehicleAnalytics(vehicleId).subscribe({
      next: (a) => {
        this.analytics = a;
        this.analyticsLoading = false;
      },
      error: () => {
        this.analyticsLoading = false;
      },
    });
  }

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

  getTypeIcon(type: string): string {
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
