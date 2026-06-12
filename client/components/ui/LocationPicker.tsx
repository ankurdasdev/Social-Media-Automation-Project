import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Button } from "./button";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

// Make sure Leaflet CSS and JS are loaded
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadLeaflet() {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).L) return resolve();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

interface LocationPickerProps {
  value?: { lat: number; lng: number; address?: string };
  onChange: (loc: { lat: number; lng: number; address?: string }) => void;
  error?: string;
  label?: string;
}

export function LocationPicker({ value, onChange, error, label = "Location" }: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [tempLoc, setTempLoc] = useState<{ lat: number; lng: number; address?: string } | null>(
    value || null
  );
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      loadLeaflet().then(() => {
        setIsMapReady(true);
        setLoading(false);
      });
    } else {
      setIsMapReady(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const L = (window as any).L;

    const defaultLoc = tempLoc || { lat: 20.5937, lng: 78.9629 }; // Default: India
    const map = L.map(mapRef.current).setView([defaultLoc.lat, defaultLoc.lng], tempLoc ? 13 : 4);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    const icon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div class="w-8 h-8 flex items-center justify-center text-rose-500 bg-white rounded-full shadow-xl shadow-rose-500/30 border-2 border-rose-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    if (tempLoc) {
      markerRef.current = L.marker([tempLoc.lat, tempLoc.lng], { icon }).addTo(map);
    }

    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      }
      
      setTempLoc({ lat, lng, address: "Fetching address..." });

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        setTempLoc({ lat, lng, address: data.display_name });
      } catch {
        setTempLoc({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      }
    });
    
    // Force a resize after mount
    setTimeout(() => { map.invalidateSize(); }, 100);
  }, [isMapReady]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const L = (window as any).L;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 13);
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else {
          const icon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `<div class="w-8 h-8 flex items-center justify-center text-rose-500 bg-white rounded-full shadow-xl border-2 border-rose-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });
          markerRef.current = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);
        }
        
        setTempLoc({ lat, lng, address: "Fetching address..." });
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(res => res.json())
          .then(data => setTempLoc({ lat, lng, address: data.display_name }))
          .catch(() => setTempLoc({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
      }
    });
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/40 block">{label}</label>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className={cn(
            "relative flex items-center rounded-2xl border transition-all duration-300 backdrop-blur-xl cursor-pointer",
            "dark:border-white/10 border-border/50 dark:bg-white/5 bg-black/5 hover:bg-white/[0.07]",
            error && "border-rose-500/50 bg-rose-500/10"
          )}>
            <div className="pl-4 pr-2 shrink-0">
              <MapPin className={cn("w-4 h-4 transition-colors", value ? "text-rose-400" : "text-foreground/25")} />
            </div>
            <div className="flex-1 h-13 py-3.5 pr-4 bg-transparent text-[15px] font-medium outline-none truncate">
              {value?.address ? (
                <span className="text-foreground">{value.address.split(',')[0]}</span>
              ) : value?.lat ? (
                <span className="text-foreground">{value.lat.toFixed(4)}, {value.lng.toFixed(4)}</span>
              ) : (
                <span className="text-foreground/20">Select on Map</span>
              )}
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] h-[600px] p-0 flex flex-col overflow-hidden dark:bg-[#0e0b1f] bg-background border dark:border-white/10 border-border/50 rounded-3xl">
          <DialogHeader className="p-4 border-b dark:border-white/10 border-border/50 shrink-0">
            <DialogTitle className="text-lg font-black tracking-tight text-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                Select Location
              </div>
              <Button size="sm" variant="outline" className="h-8 rounded-full text-xs font-bold" onClick={handleCurrentLocation}>
                <Navigation className="w-3.5 h-3.5 mr-1" /> Current Location
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 relative bg-muted/20">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
          </div>
          <div className="p-4 border-t dark:border-white/10 border-border/50 bg-muted/20 shrink-0 space-y-3">
            <div className="text-sm font-medium text-foreground/80 truncate">
              {tempLoc?.address || "Click on the map to pinpoint your location"}
            </div>
            <Button 
              className="w-full h-12 rounded-xl font-black tracking-widest uppercase transition-all"
              onClick={() => {
                if (tempLoc) onChange(tempLoc);
                setOpen(false);
              }}
            >
              Confirm Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {error && <p className="text-[11px] text-rose-400 font-bold pl-1">{error}</p>}
    </div>
  );
}
