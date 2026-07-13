import React, { useEffect, useRef } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css'; // ensure MapTiler SDK css is fully integrated

export const Map = ({ coordinates, apiKey, title, price, imageUrl }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!coordinates || !coordinates.length || !apiKey) return;
    if (mapInstance.current) return;

    maptilersdk.config.apiKey = apiKey;
    
    // Create Map
    mapInstance.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: coordinates,
      zoom: 12
    });

    // Add controls
    mapInstance.current.addControl(new maptilersdk.NavigationControl(), 'top-right');
    mapInstance.current.addControl(new maptilersdk.FullscreenControl(), 'top-right');
    mapInstance.current.addControl(new maptilersdk.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true
    }), 'top-right');

    // Create popup HTML
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}`;
    const popupHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 11px; padding: 4px; width: 170px; display: flex; flex-direction: column; gap: 6px;">
        <div style="width: 100%; height: 95px; overflow: hidden; border-radius: 6px; background-color: #f1f5f9;">
          <img src="${imageUrl || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=320&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" alt="${title}" />
        </div>
        <div style="display: flex; flex-direction: column; gap: 1px;">
          <h5 style="margin: 0; font-weight: 800; font-size: 12px; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</h5>
          <span style="font-weight: 700; color: #fe424d; font-size: 11px;">&#8377;${price?.toLocaleString('en-IN')} / night</span>
        </div>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 5px; margin-top: 2px;">
          <a href="${directionsUrl}" target="_blank" style="text-decoration: none; color: #fe424d; font-weight: 800; font-size: 11px; display: flex; align-items: center; justify-content: center; gap: 3px;">
            Get Directions →
          </a>
        </div>
      </div>
    `;

    const popup = new maptilersdk.Popup({ offset: 25 })
      .setHTML(popupHtml);

    // Create marker
    new maptilersdk.Marker({ color: '#fe424d' })
      .setLngLat(coordinates)
      .setPopup(popup)
      .addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [coordinates, apiKey, title, price, imageUrl]);

  return (
    <div ref={mapContainer} className="w-full h-[420px] rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden" />
  );
};

export default Map;
