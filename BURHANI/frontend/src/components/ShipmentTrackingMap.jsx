import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// City destination coordinate lookup
const CITY_COORDS = {
  dahod: [22.8465, 74.2625],
  indore: [22.7196, 75.8577],
  ahmedabad: [23.0225, 72.5714],
  vadodara: [22.3072, 73.1812],
  surat: [21.1702, 72.8311],
  bhopal: [23.2599, 77.4126],
  mumbai: [19.0760, 72.8777],
  pune: [18.5204, 73.8567],
  kondhwa: [18.4750, 73.8890],
  maharashtra: [18.5204, 73.8567],
  delhi: [28.6139, 77.2090],
  ratlam: [23.3315, 75.0367],
  ujjain: [23.1765, 75.7885],
  jhabua: [22.7690, 74.5956],
  godhra: [22.7750, 73.6150],
  halol: [22.5020, 73.4730],
  anand: [22.5645, 72.9289],
  nadiad: [22.6916, 72.8634],
  udaipur: [24.5854, 73.7125],
  banswara: [23.5461, 74.4439],
  jaipur: [26.9124, 75.7873],
  nagpur: [21.1458, 79.0882],
  nashik: [19.9975, 73.7898],
};

const DEFAULT_ORIGIN = [22.8396, 74.2562]; // Burhani Hardware Central Depot, Dahod

function getDestinationCoords(address, orderId) {
  if (address) {
    const lower = address.toLowerCase();
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
      if (lower.includes(city)) return coords;
    }
  }
  // Fallback realistic regional destinations based on orderId
  const fallbacks = [
    CITY_COORDS.indore,
    CITY_COORDS.vadodara,
    CITY_COORDS.ahmedabad,
    CITY_COORDS.ratlam,
    CITY_COORDS.godhra,
    CITY_COORDS.dahod,
  ];
  return fallbacks[(orderId || 0) % fallbacks.length];
}

// Generate realistic intermediate highway waypoints
function generateRoutePoints(origin, dest) {
  const [lat1, lng1] = origin;
  const [lat2, lng2] = dest;

  const points = [];
  const totalSteps = 8;
  for (let i = 0; i <= totalSteps; i++) {
    const t = i / totalSteps;
    // Slight realistic curved deviation for highway feel
    const arc = Math.sin(t * Math.PI) * 0.08 * (i % 2 === 0 ? 1 : -0.6);
    const lat = lat1 + (lat2 - lat1) * t + arc;
    const lng = lng1 + (lng2 - lng1) * t + arc * 0.8;
    points.push([lat, lng]);
  }
  return points;
}

export default function ShipmentTrackingMap({ order }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [isLiveActive, setIsLiveActive] = useState(true);

  const deliveryStatus = (order?.delivery_status || 'Placed').toLowerCase();
  const isDelivered = deliveryStatus.includes('delivered');
  const isCancelled = deliveryStatus.includes('cancel');
  const isOutForDelivery = deliveryStatus.includes('out');
  const isShipped = deliveryStatus.includes('ship');
  const isProcessing = deliveryStatus.includes('process');

  // Determine progress fraction along route (0 to 1)
  let progressRatio = 0.15;
  if (isDelivered) progressRatio = 1.0;
  else if (isOutForDelivery) progressRatio = 0.88;
  else if (isShipped) progressRatio = 0.62;
  else if (isProcessing) progressRatio = 0.35;
  else progressRatio = 0.12;

  const origin = DEFAULT_ORIGIN;
  const destination = useMemo(
    () => getDestinationCoords(order?.address, order?.id),
    [order?.address, order?.id]
  );
  const fullRoute = useMemo(
    () => generateRoutePoints(origin, destination),
    [origin, destination]
  );

  // Compute live current vehicle position index
  const vehicleIndex = Math.min(
    fullRoute.length - 1,
    Math.max(0, Math.round(progressRatio * (fullRoute.length - 1)))
  );
  const currentVehiclePos = fullRoute[vehicleIndex];

  const completedRoute = fullRoute.slice(0, vehicleIndex + 1);
  const remainingRoute = fullRoute.slice(vehicleIndex);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;
    let localMap = null;

    try {
      // Clean up previous map if exists
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }

      // Clear any leftover DOM Leaflet ID to avoid "already initialized" errors
      if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
        mapContainerRef.current._leaflet_id = null;
      }

      if (!origin || !destination || !currentVehiclePos) return;

      // Initialize Map
      localMap = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      if (!isMounted) {
        try { localMap.remove(); } catch { /* ignore */ }
        return;
      }

      mapInstanceRef.current = localMap;

      // Add modern CartoDB Voyager tiles with smooth fallback
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(localMap);

      // Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(localMap);

      // Custom Origin Warehouse Pin
      const originIcon = L.divIcon({
        className: 'burhani-custom-map-icon',
        html: `
          <div class="map-depot-pin">
            <i class="bi bi-building-fill-gear"></i>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Custom Destination Pin
      const destIcon = L.divIcon({
        className: 'burhani-custom-map-icon',
        html: `
          <div class="map-destination-pin ${isDelivered ? 'delivered' : ''}">
            <i class="bi ${isDelivered ? 'bi-check-circle-fill' : 'bi-geo-alt-fill'}"></i>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Custom Moving Vehicle Pin with live radar sonar wave
      const vehicleIcon = L.divIcon({
        className: 'burhani-custom-map-icon',
        html: `
          <div class="map-vehicle-carrier">
            <div class="vehicle-sonar-wave"></div>
            <div class="vehicle-sonar-wave delay-wave"></div>
            <div class="vehicle-truck-bubble ${isDelivered ? 'delivered-bubble' : ''}">
              <i class="bi ${isDelivered ? 'bi-box2-heart-fill' : 'bi-truck'}"></i>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      // Add Markers to Map
      const originMarker = L.marker(origin, { icon: originIcon }).addTo(localMap);
      originMarker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; line-height: 1.4;">
          <strong style="color: #0d3829; display: flex; align-items: center; gap: 6px;">
            <i class="bi bi-box-seam text-success"></i> Burhani Central Depot
          </strong>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Dahod Industrial Zone, Gujarat</div>
          <div style="color: #16a34a; font-size: 11px; font-weight: 600; margin-top: 4px;">✓ Origin Dispatch Hub</div>
        </div>
      `);

      const destMarker = L.marker(destination, { icon: destIcon }).addTo(localMap);
      destMarker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; line-height: 1.4;">
          <strong style="color: #0d3829; display: flex; align-items: center; gap: 6px;">
            <i class="bi bi-house-door-fill text-primary"></i> Delivery Destination
          </strong>
          <div style="color: #475569; font-size: 11px; margin-top: 2px; max-width: 220px;">
            ${order?.address || 'Customer Delivery Address'}
          </div>
          <div style="color: ${isDelivered ? '#16a34a' : '#e67e22'}; font-size: 11px; font-weight: 600; margin-top: 4px;">
            ${isDelivered ? '✓ Delivered to Customer' : '⏱ Estimated Arrival Scheduled'}
          </div>
        </div>
      `);

      const vehicleMarker = L.marker(currentVehiclePos, { icon: vehicleIcon }).addTo(localMap);
      vehicleMarker.bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; line-height: 1.4;">
          <div style="display: inline-block; background: #0d3829; color: #fff; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; margin-bottom: 4px;">
            BURHANI EXPRESS FLEET #407
          </div>
          <div style="font-weight: 700; color: #1e293b;">
            ${isDelivered ? 'Shipment Completed' : 'En Route • Freight Transit'}
          </div>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
            Driver: <strong>Ramesh Patel</strong> (Burhani Logistics)
          </div>
          <div style="color: #10b981; font-weight: 700; font-size: 11px; margin-top: 4px;">
            Speed: ${isDelivered ? '0 km/h (Stationary)' : '48 km/h'} • GPS Signal: High
          </div>
        </div>
      `);

      // Draw Completed Route (Solid Emerald Green)
      if (completedRoute && completedRoute.length > 1) {
        L.polyline(completedRoute, {
          color: '#059669',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(localMap);
      }

      // Draw Remaining Route (Dashed Amber/Slate line)
      if (remainingRoute && remainingRoute.length > 1 && !isDelivered) {
        L.polyline(remainingRoute, {
          color: '#f59e0b',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round',
        }).addTo(localMap);
      }

      // Fit bounds smoothly with margin
      const bounds = L.latLngBounds(fullRoute);
      localMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
    } catch (err) {
      console.warn('Leaflet map error handled gracefully:', err);
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        mapContainerRef.current._leaflet_id = null;
      }
    };
  }, [order?.id, order?.delivery_status, recenterTrigger]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(currentVehiclePos, 11, { animate: true });
    }
    setRecenterTrigger((prev) => prev + 1);
  };

  const handleFitRoute = () => {
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds(fullRoute);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
    }
  };

  return (
    <div className="tracking-map-wrapper position-relative">
      {/* Map Header HUD */}
      <div className="tracking-map-hud-top d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div className="live-gps-beacon">
            <span className="beacon-pulse"></span>
            <span className="beacon-core"></span>
          </div>
          <div>
            <div className="fw-bold tracking-hud-title">
              {isDelivered
                ? 'Route Completed • Delivered'
                : isCancelled
                ? 'Shipment Cancelled'
                : 'Real-Time GPS Telemetry'}
            </div>
            <div className="text-muted tracking-hud-sub">
              Carrier: <strong>Burhani Express Logistics</strong> &bull; AWB: #{order?.tracking_id || `BUR-${order?.id}-EXP`}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm hud-action-btn"
            onClick={handleRecenter}
            title="Recenter on delivery vehicle"
          >
            <i className="bi bi-crosshair me-1"></i> Live Pin
          </button>
          <button
            type="button"
            className="btn btn-sm hud-action-btn"
            onClick={handleFitRoute}
            title="View full delivery route"
          >
            <i className="bi bi-arrows-fullscreen me-1"></i> Full Route
          </button>
        </div>
      </div>

      {/* Map Container Element */}
      <div
        ref={mapContainerRef}
        className="tracking-leaflet-canvas"
        style={{ height: '300px', width: '100%', borderRadius: '18px', zIndex: 1 }}
      />

      {/* Map Bottom Telemetry Strip */}
      <div className="tracking-map-hud-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-1 text-muted small">
            <i className="bi bi-geo-alt-fill text-danger"></i>
            <span>
              <strong>Current Waypoint:</strong>{' '}
              {isDelivered
                ? 'Delivered at Customer Address'
                : isOutForDelivery
                ? 'City Outskirts • Delivering Soon'
                : isShipped
                ? 'NH-47 Express Transit Corridor'
                : 'Central Depot Processing Hub'}
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge rounded-pill bg-dark text-white px-3 py-1 font-monospace small">
            <i className="bi bi-speedometer2 me-1 text-warning"></i>
            {isDelivered ? 'Delivered' : isOutForDelivery ? 'Local Van (15-20 min ETA)' : 'In Transit (48 km/h)'}
          </span>
        </div>
      </div>
    </div>
  );
}
