/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import Admin from './pages/Admin';
import Billing from './pages/Billing';
import ContentManagement from './pages/ContentManagement';
import Disclaimer from './pages/Disclaimer';
import Home from './pages/Home';
import MyEnchantedQueues from './pages/MyEnchantedQueues';
import ParkDetail from './pages/ParkDetail';
import Personalization from './pages/Personalization';
import Premium from './pages/Premium';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import RideDetail from './pages/RideDetail';
import Sitemap from './pages/Sitemap';
import SitemapXml from './pages/SitemapXml';
import Success from './pages/Success';
import Terms from './pages/Terms';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Admin": Admin,
    "Billing": Billing,
    "ContentManagement": ContentManagement,
    "Disclaimer": Disclaimer,
    "Home": Home,
    "MyEnchantedQueues": MyEnchantedQueues,
    "ParkDetail": ParkDetail,
    "Personalization": Personalization,
    "Premium": Premium,
    "Privacy": Privacy,
    "Profile": Profile,
    "RideDetail": RideDetail,
    "Sitemap": Sitemap,
    "SitemapXml": SitemapXml,
    "Success": Success,
    "Terms": Terms,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};