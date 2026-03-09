import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { io, Socket } from "socket.io-client";
import { environment } from "../../../environments/environment";
import {
  LiveLocationUpdate,
  FleetAlert,
  Vehicle,
} from "../models/vehicle.model";

@Injectable({ providedIn: "root" })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  private _isConnected$ = new BehaviorSubject<boolean>(false);
  readonly isConnected$ = this._isConnected$.asObservable();

  private _locationUpdates$ = new Subject<LiveLocationUpdate>();
  readonly locationUpdates$ = this._locationUpdates$.asObservable();

  private _alerts$ = new Subject<FleetAlert>();
  readonly alerts$ = this._alerts$.asObservable();

  private _vehicleStatus$ = new Subject<{
    vehicleId: string;
    status: string;
    timestamp: string;
  }>();
  readonly vehicleStatus$ = this._vehicleStatus$.asObservable();

  private _liveVehicles$ = new Subject<Vehicle[]>();
  readonly liveVehicles$ = this._liveVehicles$.asObservable();

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      console.log("[Socket] Connected:", this.socket?.id);
      this._isConnected$.next(true);
      // Request current live vehicles on connect
      this.socket?.emit("request:live-vehicles");
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("[Socket] Disconnected:", reason);
      this._isConnected$.next(false);
    });

    this.socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      this._isConnected$.next(false);
    });

    this.socket.on("location:update", (data: LiveLocationUpdate) => {
      this._locationUpdates$.next(data);
    });

    this.socket.on("fleet:alert", (data: FleetAlert) => {
      console.warn("[Socket] Alert:", data);
      this._alerts$.next(data);
    });

    this.socket.on(
      "vehicle:status",
      (data: { vehicleId: string; status: string; timestamp: string }) => {
        this._vehicleStatus$.next(data);
      },
    );

    this.socket.on("live-vehicles", (res: { data: Vehicle[] }) => {
      this._liveVehicles$.next(res.data);
    });
  }

  subscribeToVehicle(vehicleId: string): void {
    this.socket?.emit("subscribe:vehicle", vehicleId);
  }

  unsubscribeFromVehicle(vehicleId: string): void {
    this.socket?.emit("unsubscribe:vehicle", vehicleId);
  }

  requestLiveVehicles(): void {
    this.socket?.emit("request:live-vehicles");
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this._isConnected$.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
