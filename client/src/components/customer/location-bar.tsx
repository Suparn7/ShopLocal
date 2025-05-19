import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";

export function LocationBar({ onLocationChange }: { onLocationChange: (coordinates: { lat: number; lng: number } | null) => void }) {
  const { t } = useTranslation();
  const [location, setLocation] = useState("Gandhi Chowk, Raipur");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState("");
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const cachedLocation = localStorage.getItem("userLocation");
    const cachedCoordinates = localStorage.getItem("userCoordinates");

    if (cachedLocation && cachedCoordinates) {
      const parsedCoordinates = JSON.parse(cachedCoordinates);
      setLocation(cachedLocation);
      setCoordinates(parsedCoordinates);
      onLocationChange(parsedCoordinates); // Notify parent component
    } else {
      fetchCurrentLocation(); // Fetch location if not cached
    }
  }, []);

  const fetchCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert(t("customer.geolocationNotSupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            const firstResult = data.results[0];
            const address = firstResult.formatted_address || t("customer.unknownLocation");
            const location = firstResult.geometry.location;

            // Cache the location and coordinates
            localStorage.setItem("userLocation", address);
            localStorage.setItem("userCoordinates", JSON.stringify(location));
            setLocation(address);
            setCoordinates(location);
            onLocationChange(location); // Notify parent component
          } else {
            alert(t("customer.locationFetchError"));
          }
        } catch (error) {
          console.error("Error fetching location data:", error);
          alert(t("customer.locationFetchError"));
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(t("customer.locationPermissionDenied"));
      }
    );
  };
  
  const handleLocationChange = async (newLocation: string) => {
    try {
      const { location, formattedAddress } = await fetchCoordinates(newLocation);
      console.log("Fetched coordinates:", location);
      console.log("Formatted address:", formattedAddress);
  
      // Save the location and coordinates
      setLocation(formattedAddress); // Use the formatted address as the display location
      setSavedLocations((prev) => [...prev, formattedAddress]); // Optional: Save the location
      setCoordinates(location); // Store coordinates in state
      onLocationChange(location); // Notify parent component

      console.log("Latitude:", location.lat, "Longitude:", location.lng);
    } catch (error) {
      alert(t("customer.locationFetchError"));
    } finally {
      setIsDialogOpen(false);
    }
  };
  
  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert(t("customer.geolocationNotSupported"));
      return;
    }
  
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
  
        console.log("Current location:", latitude, longitude);
  
        try {
          const response = await fetch(
            `/api/reverse-geocode?lat=${latitude}&lng=${longitude}`
          );
  
          const data = await response.json();
          console.log("Reverse geocode data:", data);
  
          if (data.results && data.results.length > 0) {
            const firstResult = data.results[0];
            const address = firstResult.formatted_address || t("customer.unknownLocation");
            const location = firstResult.geometry.location;
  
            setLocation(address); // Use the formatted address as the display location
            setCoordinates(location); // Store coordinates in state
            onLocationChange({ lat: latitude, lng: longitude }); // Notify parent component

            console.log("Latitude:", location.lat, "Longitude:", location.lng);
          } else {
            alert(t("customer.locationFetchError"));
          }
        } catch (error) {
          console.error("Error fetching location data:", error);
          alert(t("customer.locationFetchError"));
        } finally {
          setIsDialogOpen(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(t("customer.locationPermissionDenied"));
      }
    );
  };

  const fetchCoordinates = async (address: string) => {
    try {
      const response = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      console.log("Geocode response:", data);
  
      if (data.geocodingResults && data.geocodingResults.length > 0) {
        const firstResult = data.geocodingResults[0];
        return {
          location: firstResult.geometry.location, // { lat, lng }
          formattedAddress: firstResult.formatted_address,
        };
      } else {
        throw new Error("No geocoding results found");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      throw new Error("Failed to fetch coordinates");
    }
  };

  
  
  return (
    <div className="flex items-center mt-2 bg-neutral-100 rounded-lg p-2">
      <MapPin className="text-primary mr-2 h-5 w-5" />
      <div className="flex-1">
        <div className="text-sm font-medium truncate">{location}</div>
        <div className="text-xs text-neutral-400">{t("customer.showingShops")}</div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="link" size="sm" className="text-xs text-primary font-medium">
            {t("customer.changeLocation")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customer.selectLocation")}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder={t("customer.enterLocation")}
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
              />
              
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={handleUseCurrentLocation}
              >
                <i className="fas fa-map-marker-alt mr-2"></i>
                {t("customer.useCurrentLocation")}
              </Button>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-medium">{t("customer.savedLocations")}</h4>
              
              {savedLocations.map((savedLocation) => (
                <div
                  key={savedLocation}
                  className="flex items-center p-2 rounded-md hover:bg-neutral-100 cursor-pointer"
                  onClick={() => handleLocationChange(savedLocation)}
                >
                  <MapPin className="h-4 w-4 text-neutral-400 mr-2" />
                  <span className="text-sm">{savedLocation}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button 
              onClick={() => handleLocationChange(tempLocation || location)}
              disabled={!tempLocation && tempLocation !== location}
            >
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
