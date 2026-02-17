import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Castle, Sparkles, User, Shield, FileText, Moon, Sun, Heart, Info, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "framer-motion";
import NotificationBell from "@/components/NotificationBell";
import { useTheme } from "@/components/ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const themeColorMap = {
  enchanted: { r: "139", g: "92", b: "246" },
  cosmic: { r: "129", g: "140", b: "248" },
  ocean: { r: "34", g: "211", b: "238" },
  forest: { r: "16", g: "185", b: "129" },
  sunset: { r: "234", g: "88", b: "12" },
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const handleBottomNavClick = (pageName) => {
    const targetUrl = createPageUrl(pageName);
    if (location.pathname === new URL(targetUrl, window.location.origin).pathname) {
      // Already on this page - scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(targetUrl);
    }
  };

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser) {
          // Track last login
          base44.functions.invoke('trackLastLogin').catch(err => console.error("Failed to track login:", err));
        }
        return currentUser;
      } catch {
        return null;
      }
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.Subscription.filter({ user_email: user.email });
      return subs[0];
    },
    enabled: !!user?.email,
  });

  const { data: parks = [] } = useQuery({
    queryKey: ["parks"],
    queryFn: async () => {
      const allParks = await base44.entities.Park.list();
      return allParks.filter(park => !park.is_hidden);
    },
  });

  const isPremium = subscription?.plan === "premium" && subscription?.status === "active";

  // Load AdSense script and meta tag (only for non-premium users)
  useEffect(() => {
    // Don't load if subscription data hasn't loaded yet or if premium
    if (!subscription || isPremium) return;
    
    // Add meta tag
    const meta = document.createElement('meta');
    meta.name = 'google-adsense-account';
    meta.content = 'ca-pub-8118272020087343';
    document.head.appendChild(meta);

    // Add script
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8118272020087343';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(meta)) {
        document.head.removeChild(meta);
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [subscription, isPremium]);

  const themeColor = themeColorMap[activeTheme] || themeColorMap.enchanted;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`} style={{ 
      paddingTop: 'env(safe-area-inset-top)',
      "--theme-r": themeColor.r,
      "--theme-g": themeColor.g,
      "--theme-b": themeColor.b,
    }}>
      <div className={`fixed inset-0 -z-10 animated-gradient ${darkMode ? 'dark-gradient' : ''}`} />
      <style>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animated-gradient {
           background: linear-gradient(-45deg, 
             rgb(255, 255, 255), rgb(248, 250, 252), rgb(226, 232, 240), rgb(241, 245, 249), rgb(255, 255, 255));
           background-size: 400% 400%;
           animation: gradientShift 15s ease-in-out infinite;
         }
        .dark-gradient {
           background: linear-gradient(-45deg, 
             rgb(7, 14, 27), rgb(30, 41, 59), rgb(88, 28, 135), rgb(71, 85, 105), rgb(45, 55, 75)) !important;
           background-size: 400% 400%;
           animation: gradientShift 15s ease-in-out infinite;
         }
        html, body {
          overflow-y: auto;
          overflow-x: hidden;
        }
        html {
          scroll-behavior: smooth;
        }
        :root {
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
        }
        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .no-select {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        button, [role="button"], .tab, [role="tab"] {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
        }
      `}</style>
      
      <nav className={`sticky top-0 z-50 ${darkMode ? 'bg-slate-900/95 border-slate-800/80' : 'bg-white/95 border-slate-200/80'} backdrop-blur-xl border-b`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between no-select">
          {currentPageName !== "Home" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className={`gap-2 ${darkMode ? 'text-white hover:bg-slate-800' : ''}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <h1 className={`absolute left-1/2 -translate-x-1/2 font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {currentPageName.replace(/([A-Z])/g, ' $1').trim()}
              </h1>
            </>
          ) : (
            <Link to={createPageUrl("Home")} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-sm">
                <Castle className="w-4 h-4 text-white" />
              </div>
              <span className={`font-bold tracking-tight group-hover:text-violet-600 transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Enchanted-Queues
              </span>
            </Link>
          )}

          <div className="flex items-center gap-3">
            {currentPageName !== "Home" && (
              <Link to={createPageUrl("Home")}>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`gap-1.5 ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Castle className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
            )}
            
            {parks.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`gap-1.5 hidden sm:flex ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <span>Parks</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}>
                  {["Magic Kingdom", "EPCOT", "Hollywood Studios", "Animal Kingdom"].map((parkName) => {
                    const park = parks.find(p => p.name === parkName);
                    return park ? (
                      <DropdownMenuItem key={park.id} asChild>
                        <Link to={createPageUrl(`ParkDetail?parkId=${park.id}`)} className={`cursor-pointer ${darkMode ? 'text-slate-100 hover:bg-slate-800' : 'text-slate-900 hover:bg-slate-100'}`}>
                          {park.name}
                        </Link>
                      </DropdownMenuItem>
                    ) : null;
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDarkMode(!darkMode)}
              className={`${darkMode ? 'text-yellow-400 hover:bg-slate-800' : 'hover:bg-slate-100'} hidden sm:flex`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {user && <NotificationBell user={user} />}
            
            {isPremium && (
              <Link to={createPageUrl("MyEnchantedQueues")}>
                <Button size="sm" variant="outline" className={`gap-1.5 hidden sm:flex ${darkMode ? 'border-rose-900/50 text-rose-400 hover:bg-rose-900/20' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}>
                  <Heart className="w-3.5 h-3.5" />
                  My Queues
                </Button>
              </Link>
            )}
            
            {!isPremium && (
              <Link to={createPageUrl("Premium")}>
                <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50 gap-1.5 hidden sm:flex">
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade
                </Button>
              </Link>
            )}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-violet-600" />
                    </div>
                    {isPremium && (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}>
                  <div className="px-2 py-1.5 border-b border-slate-200 dark:border-slate-700">
                    <p className={`text-sm font-medium ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{user.full_name || user.email}</p>
                    {isPremium && (
                      <p className="text-xs text-amber-500 font-medium">Premium Member</p>
                    )}
                  </div>
                  <DropdownMenuSeparator className={darkMode ? 'bg-slate-700' : 'bg-slate-200'} />
                  {user.role === "admin" && (
                    <Link to={createPageUrl("Admin")}>
                      <DropdownMenuItem className={darkMode ? 'text-slate-100 focus:bg-slate-800 focus:text-slate-100 cursor-pointer' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900 cursor-pointer'}>
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <Link to={createPageUrl("Profile")}>
                    <DropdownMenuItem className={darkMode ? 'text-slate-100 focus:bg-slate-800 focus:text-slate-100 cursor-pointer' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900 cursor-pointer'}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl("Personalization")}>
                    <DropdownMenuItem className={darkMode ? 'text-slate-100 focus:bg-slate-800 focus:text-slate-100 cursor-pointer' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900 cursor-pointer'}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Personalization
                    </DropdownMenuItem>
                  </Link>
                  <Link to={createPageUrl("Premium")}>
                    <DropdownMenuItem className={darkMode ? 'text-slate-100 focus:bg-slate-800 focus:text-slate-100 cursor-pointer' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900 cursor-pointer'}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isPremium ? "Manage Subscription" : "Upgrade to Premium"}
                    </DropdownMenuItem>
                  </Link>
                  {isPremium && (
                    <Link to={createPageUrl("Billing")}>
                      <DropdownMenuItem className={darkMode ? 'text-slate-100 focus:bg-slate-800 focus:text-slate-100 cursor-pointer' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900 cursor-pointer'}>
                        <FileText className="w-4 h-4 mr-2" />
                        Billing
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <Link to={createPageUrl("About")}>
                    <DropdownMenuItem className={darkMode ? 'text-slate-100 focus:bg-slate-800 focus:text-slate-100 cursor-pointer' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900 cursor-pointer'}>
                      <Info className="w-4 h-4 mr-2" />
                      About Us
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className={darkMode ? 'bg-slate-700' : 'bg-slate-200'} />
                  <DropdownMenuItem onClick={() => setDarkMode(!darkMode)} className={darkMode ? 'text-slate-100 focus:bg-slate-800 focus:text-slate-100 sm:hidden cursor-pointer' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900 sm:hidden cursor-pointer'}>
                    {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                    Dark Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => base44.auth.logout()} className={darkMode ? 'text-slate-100 focus:bg-slate-800 focus:text-slate-100 cursor-pointer' : 'text-slate-900 focus:bg-slate-100 focus:text-slate-900 cursor-pointer'}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => base44.auth.redirectToLogin()}>
                Sign In
              </Button>
            )}
            </div>
            </div>
                  </nav>

                  <main className={`flex-1 overflow-y-auto min-h-[calc(100vh-120px)] ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-white'}`}>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={location.pathname}
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                      >
                        {children}
                      </motion.div>
                    </AnimatePresence>
                  </main>

                  {/* Mobile Bottom Navigation */}
                  <nav className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-slate-900/95 border-slate-800/80' : 'bg-white/95 border-slate-200/80'} backdrop-blur-xl border-t md:hidden`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    <div className="flex items-center justify-around h-16">
                      <Button 
                        variant={currentPageName === "Home" ? "default" : "ghost"} 
                        size="icon" 
                        className={`flex flex-col items-center gap-0.5 ${darkMode && currentPageName !== "Home" ? 'text-slate-400 hover:text-slate-200' : ''}`}
                        onClick={() => handleBottomNavClick("Home")}
                      >
                        <Castle className="w-5 h-5" />
                        <span className="text-[10px]">Home</span>
                      </Button>
                      {isPremium && (
                        <Button 
                          variant={currentPageName === "MyEnchantedQueues" ? "default" : "ghost"} 
                          size="icon" 
                          className={`flex flex-col items-center gap-0.5 ${darkMode && currentPageName !== "MyEnchantedQueues" ? 'text-slate-400 hover:text-slate-200' : ''}`}
                          onClick={() => handleBottomNavClick("MyEnchantedQueues")}
                        >
                          <Heart className="w-5 h-5" />
                          <span className="text-[10px]">My Queues</span>
                        </Button>
                      )}
                      <Button 
                        variant={currentPageName === "Profile" ? "default" : "ghost"} 
                        size="icon" 
                        className={`flex flex-col items-center gap-0.5 ${darkMode && currentPageName !== "Profile" ? 'text-slate-400 hover:text-slate-200' : ''}`}
                        onClick={() => handleBottomNavClick("Profile")}
                      >
                        <User className="w-5 h-5" />
                        <span className="text-[10px]">Profile</span>
                      </Button>
                    </div>
                  </nav>

                  {/* Footer */}
                  <footer className={`${darkMode ? 'bg-slate-900/95 border-slate-800/80' : 'bg-white/95 border-slate-200/80'} border-t backdrop-blur-sm`}>
                    <div className="max-w-6xl mx-auto px-6 py-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          © 2026 Enchanted Queues. Unofficial Disney Parks Fan App.
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <Link to={createPageUrl("About")} className={`${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                            About Us
                          </Link>
                          <span className={darkMode ? 'text-slate-700' : 'text-slate-300'}>•</span>
                          <Link to={createPageUrl("Privacy")} className={`${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                            Privacy
                          </Link>
                          <span className={darkMode ? 'text-slate-700' : 'text-slate-300'}>•</span>
                          <Link to={createPageUrl("Terms")} className={`${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                            Terms
                          </Link>
                          <span className={darkMode ? 'text-slate-700' : 'text-slate-300'}>•</span>
                          <Link to={createPageUrl("Disclaimer")} className={`${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                            Disclaimer
                          </Link>
                          <span className={darkMode ? 'text-slate-700' : 'text-slate-300'}>•</span>
                          <a href="/sitemapxml" target="_blank" rel="noopener noreferrer" className={`${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'} transition-colors`}>
                            Sitemap
                          </a>
                        </div>
                      </div>
                    </div>
                  </footer>
                  <Toaster />
                  </div>
                  );
                  }