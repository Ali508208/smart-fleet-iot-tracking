import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, RouterOutlet } from "@angular/router";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Subscription } from "rxjs";
import { SocketService } from "./core/services/socket.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule,
  ],
  template: `
    <div class="app-container">
      <!-- Sidebar Navigation -->
      <nav class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <mat-icon class="logo-icon">local_shipping</mat-icon>
            <div class="logo-text">
              <span class="brand-name">FleetTrack</span>
              <span class="brand-subtitle">IoT Platform</span>
            </div>
          </div>
        </div>

        <div class="sidebar-status">
          <div
            class="connection-badge"
            [class.connected]="isConnected"
            [class.disconnected]="!isConnected"
          >
            <span class="status-dot"></span>
            {{ isConnected ? "Live" : "Offline" }}
          </div>
        </div>

        <mat-nav-list class="nav-list">
          <a
            mat-list-item
            routerLink="/dashboard"
            routerLinkActive="active-link"
            class="nav-item"
          >
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a
            mat-list-item
            routerLink="/map"
            routerLinkActive="active-link"
            class="nav-item"
          >
            <mat-icon matListItemIcon>map</mat-icon>
            <span matListItemTitle>Live Map</span>
          </a>
          <a
            mat-list-item
            routerLink="/vehicles"
            routerLinkActive="active-link"
            class="nav-item"
          >
            <mat-icon matListItemIcon>directions_car</mat-icon>
            <span matListItemTitle>Vehicles</span>
          </a>
        </mat-nav-list>

        <div class="sidebar-footer">
          <div class="alerts-count" *ngIf="alertCount > 0">
            <mat-icon class="alert-icon">notifications_active</mat-icon>
            <span>{{ alertCount }} Alert{{ alertCount !== 1 ? "s" : "" }}</span>
          </div>
          <div class="version-info">v1.0.0 — IoT Fleet System</div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top bar -->
        <header class="top-bar">
          <div class="top-bar-left">
            <h1 class="page-title">{{ getPageTitle() }}</h1>
          </div>
          <div class="top-bar-right">
            <div class="live-indicator" *ngIf="isConnected">
              <span class="pulse-dot"></span>
              Live Tracking Active
            </div>
            <span class="timestamp">{{ currentTime | date: "HH:mm:ss" }}</span>
          </div>
        </header>

        <div class="content-area">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        overflow: hidden;
      }

      .app-container {
        display: flex;
        height: 100vh;
        background: #0f1117;
        font-family: "Inter", sans-serif;
      }

      /* ── Sidebar ── */
      .sidebar {
        width: 240px;
        min-width: 240px;
        background: #161b27;
        border-right: 1px solid #1e2d45;
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }

      .sidebar-header {
        padding: 20px 16px 12px;
        border-bottom: 1px solid #1e2d45;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .logo-icon {
        color: #3b82f6;
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .logo-text {
        display: flex;
        flex-direction: column;
      }

      .brand-name {
        font-size: 18px;
        font-weight: 700;
        color: #f1f5f9;
        line-height: 1.1;
      }

      .brand-subtitle {
        font-size: 10px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .sidebar-status {
        padding: 12px 16px;
        border-bottom: 1px solid #1e2d45;
      }

      .connection-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .connection-badge.connected {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
        border: 1px solid rgba(34, 197, 94, 0.3);
      }

      .connection-badge.disconnected {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.4;
        }
      }

      .nav-list {
        flex: 1;
        padding: 12px 8px;
        overflow-y: auto;
      }

      .nav-item {
        border-radius: 8px;
        margin-bottom: 2px;
        color: #8b9ab7 !important;
        transition: all 0.2s ease;
      }

      .nav-item:hover {
        background: rgba(59, 130, 246, 0.1) !important;
        color: #e2e8f0 !important;
      }

      .nav-item.active-link {
        background: rgba(59, 130, 246, 0.15) !important;
        color: #3b82f6 !important;
        font-weight: 600;
      }

      .nav-item mat-icon {
        color: inherit !important;
      }

      .sidebar-footer {
        padding: 12px 16px;
        border-top: 1px solid #1e2d45;
      }

      .alerts-count {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #f59e0b;
        font-size: 13px;
        margin-bottom: 8px;
      }

      .alert-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .version-info {
        font-size: 11px;
        color: #374151;
      }

      /* ── Main Content ── */
      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-width: 0;
      }

      .top-bar {
        height: 60px;
        min-height: 60px;
        background: #161b27;
        border-bottom: 1px solid #1e2d45;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
      }

      .page-title {
        font-size: 18px;
        font-weight: 600;
        color: #f1f5f9;
        margin: 0;
      }

      .top-bar-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .live-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #22c55e;
        font-size: 13px;
        font-weight: 500;
      }

      .pulse-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
        animation: pulse 1s infinite;
      }

      .timestamp {
        font-size: 14px;
        color: #64748b;
        font-variant-numeric: tabular-nums;
        font-family: "Courier New", monospace;
      }

      .content-area {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        background: #0f1117;
      }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  isConnected = false;
  alertCount = 0;
  currentTime = new Date();
  private subs: Subscription[] = [];
  private clockInterval?: ReturnType<typeof setInterval>;

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    this.socketService.connect();

    this.subs.push(
      this.socketService.isConnected$.subscribe((v) => (this.isConnected = v)),
    );

    this.subs.push(
      this.socketService.alerts$.subscribe(() => this.alertCount++),
    );

    this.clockInterval = setInterval(
      () => (this.currentTime = new Date()),
      1000,
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.socketService.disconnect();
  }

  getPageTitle(): string {
    const path = window.location.pathname;
    if (path.includes("map")) return "Live Fleet Map";
    if (path.includes("vehicles")) return "Fleet Vehicles";
    return "Fleet Dashboard";
  }
}
