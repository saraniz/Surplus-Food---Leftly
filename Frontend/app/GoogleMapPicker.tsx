// app/GoogleMapPicker.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";
import { Loader2, Navigation, MapPin, AlertCircle, Check } from "lucide-react";

type LatLng = { lat: number; lng: number };

interface GoogleMapPickerProps {
  initialPosition?: LatLng;
  onChange?: (pos: LatLng) => void;
  showControls?: boolean;
  zoom?: number;
  style?: React.CSSProperties;
  onLocationSelect: (position: { lat: number; lng: number; address?: string }) => void;
  showConfirmButton?: boolean;
  onConfirm?: (position: { lat: number; lng: number; address?: string }) => void;
}

// Default center (Colombo)
const defaultCenter = {
  lat: 6.9271,
  lng: 79.8612,
};

// Map container style
const defaultContainerStyle = {
  width: "100%",
  height: "400px",
};

// Map options
const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
};

// Define libraries as a constant outside component
const LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export default function GoogleMapPicker({
  initialPosition = defaultCenter,
  onChange,
  showControls = true,
  zoom = 13,
  style = defaultContainerStyle,
  onLocationSelect,
  showConfirmButton = true,
  onConfirm,
}: GoogleMapPickerProps) {
  const [position, setPosition] = useState<LatLng | null>(initialPosition);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>("");

  // Debug: Check if API key is available
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    console.log("Google Maps API Key:", apiKey ? "Loaded" : "Missing");
    if (!apiKey) {
      setMapError("Google Maps API key is missing. Check your .env.local file.");
    }
  }, []);

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  // Handle errors
  useEffect(() => {
    if (loadError) {
      setMapError(`Failed to load Google Maps: ${loadError.message}`);
      console.error("Google Maps load error:", loadError);
    }
  }, [loadError]);

  // Initialize position
  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  // Reverse geocode to get address from coordinates
  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      
      if (response.results && response.results[0]) {
        return response.results[0].formatted_address;
      }
      return `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error("Geocoding error:", error);
      return `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Handle map click
  const handleMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const newPosition = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        setPosition(newPosition);
        setIsLocationSelected(true);
        
        // Get address for the clicked location
        const address = await getAddressFromCoordinates(newPosition.lat, newPosition.lng);
        setSelectedAddress(address);
        
        setInfoWindowOpen(true);
        onChange?.(newPosition);
        
        // Call onLocationSelect immediately when user clicks
        onLocationSelect?.({
          lat: newPosition.lat,
          lng: newPosition.lng,
          address: address
        });
      }
    },
    [onChange, onLocationSelect, getAddressFromCoordinates]
  );

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const newPosition = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        setPosition(newPosition);
        setIsLocationSelected(true);
        
        // Get address for the dragged location
        const address = await getAddressFromCoordinates(newPosition.lat, newPosition.lng);
        setSelectedAddress(address);
        
        onChange?.(newPosition);
        
        // Call onLocationSelect when user drags marker
        onLocationSelect?.({
          lat: newPosition.lat,
          lng: newPosition.lng,
          address: address
        });
      }
    },
    [onChange, onLocationSelect, getAddressFromCoordinates]
  );

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (location) => {
        const newPosition = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        setPosition(newPosition);
        setIsLocationSelected(true);
        
        // Get address for current location
        const address = await getAddressFromCoordinates(newPosition.lat, newPosition.lng);
        setSelectedAddress(address);
        
        setInfoWindowOpen(true);
        onChange?.(newPosition);
        
        // Call onLocationSelect when user gets current location
        onLocationSelect?.({
          lat: newPosition.lat,
          lng: newPosition.lng,
          address: address
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please enable location services.");
      }
    );
  }, [onChange, onLocationSelect, getAddressFromCoordinates]);

  // Search location using Geocoding
  const searchLocation = useCallback(async () => {
    const searchTerm = prompt("Enter location to search:");
    if (!searchTerm) return;

    if (!isLoaded) {
      alert("Google Maps is not loaded yet. Please wait.");
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchTerm }, async (results, status) => {
      if (status === "OK" && results && results[0]) {
        const newPosition = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        setPosition(newPosition);
        setIsLocationSelected(true);
        
        // Get address for searched location
        const address = results[0].formatted_address;
        setSelectedAddress(address);
        
        setInfoWindowOpen(true);
        onChange?.(newPosition);
        
        // Call onLocationSelect when user searches location
        onLocationSelect?.({
          lat: newPosition.lat,
          lng: newPosition.lng,
          address: address
        });
      } else {
        alert("Location not found. Please try a different search term.");
      }
    });
  }, [isLoaded, onChange, onLocationSelect]);

// In GoogleMapPicker component, update the handleConfirmLocation function:
const handleConfirmLocation = useCallback(() => {
  if (position) {
    console.log("✅ Location confirmed from map component:", position, selectedAddress);
    onConfirm?.({
      lat: position.lat,
      lng: position.lng,
      address: selectedAddress
    });
  }
}, [position, selectedAddress, onConfirm]);

  // Error display
  if (mapError) {
    return (
      <div className="space-y-4">
        <div style={style} className="relative rounded-lg overflow-hidden shadow-lg border border-red-300 bg-red-50">
          <div className="flex flex-col items-center justify-center h-full p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Google Maps Error</h3>
            <p className="text-red-600 text-center">{mapError}</p>
            <div className="mt-4 text-sm text-red-700 bg-red-100 p-3 rounded">
              <p className="font-medium mb-1">To fix this:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Get a Google Maps API key from <a href="https://console.cloud.google.com/" className="underline">Google Cloud Console</a></li>
                <li>Add to your .env.local file: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here</li>
                <li>Restart your development server</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <div style={style} className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-gray-600">Loading Google Maps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div style={style} className="relative rounded-lg overflow-hidden shadow-lg border border-gray-300">
        <GoogleMap
          mapContainerStyle={style}
          center={position || defaultCenter}
          zoom={zoom}
          options={defaultOptions}
          onClick={handleMapClick}
        >
          {position && (
            <Marker
              position={position}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
              onClick={() => setInfoWindowOpen(true)}
              animation={google.maps.Animation.DROP}
              icon={{
                url: `data:image/svg+xml;base64,${btoa(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                    <path fill="${isLocationSelected ? '#10b981' : '#ef4444'}" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 40),
              }}
            >
              {infoWindowOpen && (
                <InfoWindow
                  position={position}
                  onCloseClick={() => setInfoWindowOpen(false)}
                >
                  <div className="p-2">
                    <p className="font-semibold text-gray-800">Selected Location</p>
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedAddress || `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`}
                    </p>
                    {showConfirmButton && (
                      <button
                        onClick={handleConfirmLocation}
                        className="w-full px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check size={16} />
                        Confirm This Location
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Marker>
          )}
        </GoogleMap>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="space-y-4">
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="flex-1 min-w-[150px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Navigation size={18} />
              Use Current Location
            </button>
            <button
              type="button"
              onClick={searchLocation}
              className="flex-1 min-w-[150px] px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <MapPin size={18} />
              Search Location
            </button>
            {showConfirmButton && position && (
              <button
                type="button"
                onClick={handleConfirmLocation}
                className={`flex-1 min-w-[150px] px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  isLocationSelected 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-purple-400 cursor-not-allowed'
                }`}
                disabled={!isLocationSelected}
              >
                <Check size={18} />
                Confirm Location
              </button>
            )}
          </div>

          {/* Selected Location Display */}
          {position && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800">
                      Selected Location
                    </h4>
                    {isLocationSelected && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                        Ready to confirm
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Coordinates:</p>
                    <p>
                      <span className="font-medium">Latitude:</span>{" "}
                      {position.lat.toFixed(6)}
                    </p>
                    <p>
                      <span className="font-medium">Longitude:</span>{" "}
                      {position.lng.toFixed(6)}
                    </p>
                    {selectedAddress && (
                      <>
                        <p className="font-medium mt-2 mb-1">Address:</p>
                        <p className="text-gray-700">{selectedAddress}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInfoWindowOpen(true)}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Show Info
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(
                          `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
                        );
                        alert("Coordinates copied to clipboard!");
                      }
                    }}
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                  >
                    Copy Coordinates
                  </button>
                  {showConfirmButton && (
                    <button
                      type="button"
                      onClick={handleConfirmLocation}
                      className="px-4 py-1 text-sm bg-purple-600 text-white border border-purple-700 rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                      disabled={!isLocationSelected}
                    >
                      <Check size={14} />
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Instructions:</strong> 
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Click anywhere on the map to select a location</li>
                <li>Drag the marker to adjust the position</li>
                <li>Use "Use Current Location" or "Search Location" for quick selection</li>
                {showConfirmButton && (
                  <li className="font-semibold">Click "Confirm Location" to finalize your selection</li>
                )}
              </ol>
            </p>
          </div>

          {/* Confirmation Status */}
          {showConfirmButton && position && (
            <div className={`p-3 rounded-lg border ${isLocationSelected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <p className={`text-sm ${isLocationSelected ? 'text-green-700' : 'text-yellow-700'}`}>
                {isLocationSelected 
                  ? '✅ Location selected! Click "Confirm Location" to finalize.'
                  : '📍 Click on the map to select a delivery location first.'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}