import "./styles/index.css";
import "./styles/diagnosis-prob.css";
import "./styles/progress-bar.css";

import ReactDOM from "react-dom/client";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { DemonstratorPage, DisplayEventsPage, SampleSelectorPage } from "./pages";

export const ROUTES = [
  {
    path: "/",
    element: <SampleSelectorPage />,
  },
  {
    path: "/demonstrator",
    element: <DemonstratorPage />,
  },
  {
    path: "/display-patterns",
    element: <DisplayEventsPage />,
  },
];

export function render(routerFactory: typeof createMemoryRouter) {
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<RouterProvider router={routerFactory(ROUTES)} />);
}
