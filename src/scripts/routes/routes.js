// routes/routes.js - Simple Version
import LoginPage from "../pages/auth/login-page.js";
import RegisterPage from "../pages/auth/register-page.js";
import MapPage from "../pages/map/map-page.js";
import AddStoryPage from "../pages/add-story/add-story-page.js";
import SavedPage from "../pages/saved/saved-page.js";

const routes = {
  '/': MapPage,
  '/map': MapPage,
  '/add': AddStoryPage,
  '/saved': SavedPage,
  '/login': LoginPage,
  '/register': RegisterPage,
};

export default routes;