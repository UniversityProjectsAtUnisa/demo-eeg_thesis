import './styles/index.css';
import './styles/diagnosis-prob.css';
import './styles/progress-bar.css';

import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { DemonstratorPage, DisplayEventsPage, SampleSelectorPage } from './pages';

export const ROUTES = [
  {
    path: '/',
    element: <SampleSelectorPage />,
  },
  {
    path: '/demonstrator',
    element: <DemonstratorPage />,
  },
  {
    path: '/display-events',
    element: <DisplayEventsPage />,
  }
];

export function render(routerFactory: any) {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<RouterProvider router={routerFactory(ROUTES)} />);
}
