import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { submitComplaint } from "../api/complaintsApi";
import PageShell from "../components/PageShell";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationPicker({ lat, lng, setLat, setLng }) {
  const map = useMapEvents({
    click(e) {
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    },
  });

  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.flyTo([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);

  return lat !== null && lng !== null ? <Marker position={[lat, lng]} icon={markerIcon} /> : null;
}

export default function SubmitComplaintPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const [text, setText] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Waiting for GPS permission...");

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation not supported. Pin on map.");
      return;
    }

    setLocationStatus("Fetching current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocationStatus("Location fetched via GPS.");
      },
      () => {
        setLocationStatus("GPS failed or denied. Pin on map.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    requestCurrentLocation();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (lat !== null && lng !== null && locationStatus.includes("Pin")) {
      setLocationStatus("Location pinned on map.");
    }
  }, [lat, lng, locationStatus]);

  const startCamera = async () => {
    setIsCameraActive(true);
    setImage(null);
    setImagePreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError("Webcam access denied or unavailable.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "webcam_photo.jpg", { type: "image/jpeg" });
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      stopCamera();
    }, "image/jpeg");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      stopCamera();
    }
  };

  const clearPhoto = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!image) {
      setError("Please take a photo or upload an image.");
      return;
    }

    if (lat === null || lng === null) {
      setError("Location is required. Allow GPS or pin on map.");
      return;
    }

    setIsSubmitting(true);
    try {
      const complaint = await submitComplaint({
        text: text || "Issue observed at location",
        lat,
        lng,
        image,
      });
      navigate(`/complaints/${complaint.complaint_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Complaint submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell title="">
      <form onSubmit={handleSubmit} className="wireframe-form">
        <div className="top-panels">
          {/* Photo Panel */}
          <div className="panel-card">
            {isCameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="video-preview" />
                <div className="camera-controls">
                  <button type="button" onClick={capturePhoto} className="camera-btn">
                    Capture
                  </button>
                  <button type="button" onClick={stopCamera} className="camera-btn" style={{ background: "#9ca3af" }}>
                    Cancel
                  </button>
                </div>
              </>
            ) : imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="preview-img" />
                <div className="camera-controls">
                  <button type="button" onClick={clearPhoto} className="camera-btn">
                    Retake / Clear
                  </button>
                </div>
              </>
            ) : (
              <div className="panel-content">
                <div
                  className="dashed-box"
                  onClick={() => {
                    const choice = window.confirm("Use Webcam? (Click Cancel to upload a file instead)");
                    if (choice) {
                      startCamera();
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <svg
                    className="camera-icon"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
              </div>
            )}
            <div className="panel-label">Tap to upload / take photo</div>
          </div>

          {/* Location Panel */}
          <div className="panel-card">
            <div style={{ flex: 1, zIndex: 1 }}>
              {/* Force map re-render when location is initially fetched otherwise it stays on default */}
              <MapContainer
                center={lat !== null && lng !== null ? [lat, lng] : [28.6139, 77.209]}
                zoom={14}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
                />
                <LocationPicker lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
              </MapContainer>
            </div>
            <div className="panel-label">Pin location</div>
          </div>
        </div>

        <p className="location-status">{locationStatus}</p>
        <p className="location-status">
          {lat !== null && lng !== null ? `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}` : "No coordinates selected yet."}
        </p>
        <button type="button" onClick={requestCurrentLocation} className="camera-btn">
          Retry GPS
        </button>

        <textarea
          className="full-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the issue..."
          required
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={isSubmitting} className="submit-btn-large">
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </PageShell>
  );
}
