import MapPage from '../pages/map/map-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';
import SavedPage from '../pages/saved/saved-page';

const routes = {
  '/': new MapPage(),
  '/map': new MapPage(),
  '/add': new AddStoryPage(),
  '/saved': new SavedPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
};

export default routes;
