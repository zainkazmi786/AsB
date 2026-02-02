import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-accent mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4 ltr-nums">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          صفحہ نہیں ملا
        </p>
        <p className="text-muted-foreground mb-6">
          مطلوبہ صفحہ: <code className="bg-muted px-2 py-1 rounded ltr-nums">{location.pathname}</code>
        </p>
        <Link to="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            واپس جائیں
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
