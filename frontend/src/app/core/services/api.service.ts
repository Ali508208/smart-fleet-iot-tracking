import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import {
  Vehicle,
  LocationRecord,
  FleetStats,
  VehicleAnalytics,
} from "../models/vehicle.model";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Vehicles ──────────────────────────────────────────────────────────────

  getVehicles(): Observable<Vehicle[]> {
    return this.http
      .get<ApiResponse<Vehicle[]>>(`${this.base}/vehicles`)
      .pipe(map((r) => r.data));
  }

  getVehicle(id: string): Observable<Vehicle> {
    return this.http
      .get<ApiResponse<Vehicle>>(`${this.base}/vehicles/${id}`)
      .pipe(map((r) => r.data));
  }

  createVehicle(payload: Partial<Vehicle>): Observable<Vehicle> {
    return this.http
      .post<ApiResponse<Vehicle>>(`${this.base}/vehicles`, payload)
      .pipe(map((r) => r.data));
  }

  updateVehicle(id: string, payload: Partial<Vehicle>): Observable<Vehicle> {
    return this.http
      .put<ApiResponse<Vehicle>>(`${this.base}/vehicles/${id}`, payload)
      .pipe(map((r) => r.data));
  }

  deleteVehicle(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/vehicles/${id}`)
      .pipe(map(() => undefined));
  }

  getFleetStats(): Observable<FleetStats> {
    return this.http
      .get<ApiResponse<FleetStats>>(`${this.base}/vehicles/stats/summary`)
      .pipe(map((r) => r.data));
  }

  // ── Tracking ──────────────────────────────────────────────────────────────

  getLocationHistory(
    vehicleId: string,
    options?: { from?: string; to?: string; limit?: number },
  ): Observable<LocationRecord[]> {
    let params = new HttpParams();
    if (options?.from) params = params.set("from", options.from);
    if (options?.to) params = params.set("to", options.to);
    if (options?.limit) params = params.set("limit", options.limit.toString());

    return this.http
      .get<
        ApiResponse<LocationRecord[]>
      >(`${this.base}/tracking/history/${vehicleId}`, { params })
      .pipe(map((r) => r.data));
  }

  getLiveLocations(): Observable<Vehicle[]> {
    return this.http
      .get<ApiResponse<Vehicle[]>>(`${this.base}/tracking/live`)
      .pipe(map((r) => r.data));
  }

  getVehicleAnalytics(
    vehicleId: string,
    from?: string,
    to?: string,
  ): Observable<VehicleAnalytics> {
    let params = new HttpParams();
    if (from) params = params.set("from", from);
    if (to) params = params.set("to", to);

    return this.http
      .get<
        ApiResponse<VehicleAnalytics>
      >(`${this.base}/tracking/analytics/${vehicleId}`, { params })
      .pipe(map((r) => r.data));
  }

  getTripRoute(
    vehicleId: string,
    tripId: string,
  ): Observable<LocationRecord[]> {
    return this.http
      .get<
        ApiResponse<LocationRecord[]>
      >(`${this.base}/tracking/route/${vehicleId}/${tripId}`)
      .pipe(map((r) => r.data));
  }
}
