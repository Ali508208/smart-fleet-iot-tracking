import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("./features/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    title: "Fleet Dashboard",
  },
  {
    path: "map",
    loadComponent: () =>
      import("./features/map-view/map.component").then((m) => m.MapComponent),
    title: "Live Map",
  },
  {
    path: "vehicles",
    loadComponent: () =>
      import("./features/vehicles/vehicles.component").then(
        (m) => m.VehiclesComponent,
      ),
    title: "Fleet Vehicles",
  },
  {
    path: "**",
    redirectTo: "dashboard",
  },
];
