import { dAppName } from 'config';
import withPageTitle from './components/PageTitle';
import Staking from './pages';
import Dashboard from './pages/Dashboard';
import IDOs from './pages/IDOs';
import Spume_IDOs from './pages/IDOs/spume';
export const routeNames = {
  staking: '/',
  unlock: '/unlock',
  dashboard: '/dashboard',
  idos: '/idos',
  idos_spume: '/idos/spume',
};

const routes: Array<any> = [

  {
    path: routeNames.staking,
    title: 'Staking',
    component: Staking
  },
  { 
    path: routeNames.dashboard,
    title: 'Dashboard',
    component: Dashboard
  },
  { 
    path: routeNames.idos,
    title: 'IDOs',
    component: IDOs
  },
  { 
    path: routeNames.idos_spume,
    title: 'SPUME IDOs',
    component: Spume_IDOs
  }
];

const mappedRoutes = routes.map((route) => {
  const title = route.title
    ? `${route.title} • ${dAppName}`
    : `${dAppName}`;

  const requiresAuth = Boolean(route.authenticatedRoute);
  const wrappedComponent = withPageTitle(title, route.component);

  return {
    path: route.path,
    component: wrappedComponent,
    authenticatedRoute: requiresAuth
  };
});

export default mappedRoutes;
