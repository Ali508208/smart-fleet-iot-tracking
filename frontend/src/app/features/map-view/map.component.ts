import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  NgZone,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatChipsModule } from "@angular/material/chips";
import { MatDividerModule } from "@angular/material/divider";
import { Subscription } from "rxjs";
import * as L from "leaflet";

import { ApiService } from "../../core/services/api.service";
import { SocketService } from "../../core/services/socket.service";
import {
  Vehicle,
  LocationRecord,
  LiveLocationUpdate,
} from "../../core/models/vehicle.model";

// Heading → rotation map for markers
type VehicleMarkerData = {
  marker: L.Marker;
  polyline: L.Polyline;
  trailCoords: L.LatLngTuple[];
  vehicle: Vehicle;
  popup: L.Popup;
};

@Component({
  selector: "app-map",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("mapContainer", { static: true }) mapContainer!: ElementRef;

  private map!: L.Map;
  private vehicleMarkers = new Map<string, VehicleMarkerData>();
  vehicles: Vehicle[] = [];
  selectedVehicle: Vehicle | null = null;
  routeHistory: LocationRecord[] = [];
  private routeLayer: L.LayerGroup = L.layerGroup();
  private subs: Subscription[] = [];
  updateCount = 0;

  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.socketService.locationUpdates$.subscribe((update) => {
        this.ngZone.run(() => this.handleLocationUpdate(update));
      }),
    );
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadVehicles();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [37.7749, -122.4194],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    // Dark tile layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      },
    ).addTo(this.map);

    this.routeLayer.addTo(this.map);
  }

  private loadVehicles(): void {
    this.apiService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        vehicles.forEach((v) => {
          if (v.lastLocation?.latitude) {
            this.addOrUpdateMarker(v.vehicleId, {
              vehicleId: v.vehicleId,
              latitude: v.lastLocation.latitude,
              longitude: v.lastLocation.longitude,
              speed: v.lastLocation.speed,
              heading: v.lastLocation.heading,
              timestamp: v.lastLocation.timestamp,
              status: v.status,
              distanceFromPrevious: 0,
            });
          }
        });
        // Fit map to all markers
        const coords = vehicles
          .filter((v) => v.lastLocation?.latitude)
          .map(
            (v) =>
              [
                v.lastLocation!.latitude,
                v.lastLocation!.longitude,
              ] as L.LatLngTuple,
          );
        if (coords.length > 0) {
          this.map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
        }
      },
    });
  }

  private createVehicleIcon(
    type: string,
    status: string,
    heading: number,
  ): L.DivIcon {
    const color = this.statusColor(status);
    const emoji =
      type === "bus"
        ? "🚌"
        : type === "car"
          ? "🚗"
          : type === "van"
            ? "🚐"
            : "🚚";
    return L.divIcon({
      className: "",
      html: `
        <div class="vehicle-marker" style="transform: rotate(${heading}deg);">
          <div class="marker-body" style="background:${color};border-color:${color}33;">
            <span class="marker-emoji">${emoji}</span>
          </div>
          <div class="marker-pulse" style="background:${color};"></div>
        </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
    });
  }

  private addOrUpdateMarker(
    vehicleId: string,
    update: LiveLocationUpdate,
  ): void {
    const latlng: L.LatLngTuple = [update.latitude, update.longitude];
    const vehicle = this.vehicles.find((v) => v.vehicleId === vehicleId);
    const type = vehicle?.type || "truck";

    if (this.vehicleMarkers.has(vehicleId)) {
      const data = this.vehicleMarkers.get(vehicleId)!;
      data.marker.setLatLng(latlng);
      data.marker.setIcon(
        this.createVehicleIcon(type, update.status, update.heading),
      );

      // Update trail
      data.trailCoords.push(latlng);
      if (data.trailCoords.length > 60) data.trailCoords.shift();
      data.polyline.setLatLngs(data.trailCoords);

      // Update popup
      data.popup.setContent(this.buildPopupHtml(vehicleId, update, vehicle));
    } else {
      const icon = this.createVehicleIcon(type, update.status, update.heading);
      const marker = L.marker(latlng, { icon });
      const popup = L.popup({ className: "fleet-popup" }).setContent(
        this.buildPopupHtml(vehicleId, update, vehicle),
      );
      marker.bindPopup(popup);
      marker.on("click", () => this.selectVehicle(vehicleId));
      marker.addTo(this.map);

      const polyline = L.polyline([latlng], {
        color: this.statusColor(update.status),
        weight: 2,
        opacity: 0.7,
        dashArray: "4 4",
      }).addTo(this.map);

      this.vehicleMarkers.set(vehicleId, {
        marker,
        polyline,
        trailCoords: [latlng],
        vehicle: vehicle || ({} as Vehicle),
        popup,
      });
    }

    if (vehicle) vehicle.status = update.status as Vehicle["status"];
  }

  private buildPopupHtml(
    vehicleId: string,
    update: LiveLocationUpdate,
    vehicle?: Vehicle,
  ): string {
    return `
      <div class="popup-content">
        <div class="popup-title">${vehicleId}</div>
        <div class="popup-name">${vehicle?.name || ""}</div>
        <div class="popup-row"><span>Speed</span><strong>${update.speed} km/h</strong></div>
        <div class="popup-row"><span>Heading</span><strong>${update.heading}°</strong></div>
        <div class="popup-row"><span>Status</span><strong>${update.status}</strong></div>
        <div class="popup-row"><span>Driver</span><strong>${vehicle?.driver?.name || "N/A"}</strong></div>
        <div class="popup-time">${new Date(update.timestamp).toLocaleTimeString()}</div>
      </div>`;
  }

  private handleLocationUpdate(update: LiveLocationUpdate): void {
    this.updateCount++;
    this.addOrUpdateMarker(update.vehicleId, update);
    const vehicle = this.vehicles.find((v) => v.vehicleId === update.vehicleId);
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
  }

  selectVehicle(vehicleId: string): void {
    const vehicle =
      this.vehicles.find((v) => v.vehicleId === vehicleId) || null;
    this.selectedVehicle = vehicle;

    const data = this.vehicleMarkers.get(vehicleId);
    if (data) {
      this.map.setView(data.marker.getLatLng(), 14, { animate: true });
      data.marker.openPopup();
      this.loadRouteHistory(vehicleId);
    }
  }

  loadRouteHistory(vehicleId: string): void {
    const from = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    this.apiService
      .getLocationHistory(vehicleId, { from, limit: 200 })
      .subscribe({
        next: (locations) => {
          this.routeHistory = locations;
          this.drawRouteHistory(locations);
        },
      });
  }

  private drawRouteHistory(locations: LocationRecord[]): void {
    this.routeLayer.clearLayers();
    if (locations.length < 2) return;

    const coords = [...locations]
      .reverse()
      .map((l) => [l.latitude, l.longitude] as L.LatLngTuple);

    L.polyline(coords, {
      color: "#3b82f6",
      weight: 3,
      opacity: 0.8,
    }).addTo(this.routeLayer);

    // Start marker
    L.circleMarker(coords[0], {
      radius: 8,
      fillColor: "#22c55e",
      color: "#fff",
      weight: 2,
      fillOpacity: 1,
    })
      .bindTooltip("Trip Start")
      .addTo(this.routeLayer);
  }

  fitAllVehicles(): void {
    const coords: L.LatLngTuple[] = [];
    this.vehicleMarkers.forEach((data) =>
      coords.push(data.marker.getLatLng() as unknown as L.LatLngTuple),
    );
    if (coords.length > 0) {
      this.map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    }
  }

  clearSelection(): void {
    this.selectedVehicle = null;
    this.routeHistory = [];
    this.routeLayer.clearLayers();
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
}
