import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { TYPE_LABEL } from '../lib/labels';
import { PageHeader, StatusBadge } from '../components/ui';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api('/vehicles/map').then(setItems).catch(console.error);
  }, []);

  const center = items.length
    ? [items[0].currentLat, items[0].currentLng]
    : [-23.5505, -46.6333];

  return (
    <div>
      <PageHeader title="Mapa da empresa" subtitle="Onde cada veículo está agora" />
      <div className="card overflow-hidden h-[70vh]">
        <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {items.map((v) => (
            <Marker key={v.id} position={[v.currentLat, v.currentLng]} icon={icon}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-bold">{v.plate}</div>
                  <div>{v.model} · {TYPE_LABEL[v.type]}</div>
                  <StatusBadge status={v.status} />
                  <div>{v.locationLabel}</div>
                  <Link to={`/veiculos/${v.id}`}>Abrir histórico</Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
