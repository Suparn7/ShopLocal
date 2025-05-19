import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/i18n"; // Import i18n configuration
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// Load Font Awesome CSS
const fontAwesomeCSS = document.createElement("link");
fontAwesomeCSS.rel = "stylesheet";
fontAwesomeCSS.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
document.head.appendChild(fontAwesomeCSS);

// Load Google Fonts
const googleFonts = document.createElement("link");
googleFonts.rel = "stylesheet";
googleFonts.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Hind:wght@400;500;600&display=swap";
document.head.appendChild(googleFonts);

// Set page title
document.title = "ShopLocal - Connect with nearby shops";

createRoot(document.getElementById("root")!).render(
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  }>
    <App />
    
  </Suspense>
);
