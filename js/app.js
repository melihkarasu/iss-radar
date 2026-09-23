let map = null;
        let issMarker = null;
        let issPath = [];
        let pathLine = null;
        let currentPos = [0, 0];
        let pollTimer = null;

        function initMap() {
          map = L.map('iss-map', {
            center: [20, 0],
            zoom: 2,
            minZoom: 1,
            maxZoom: 8
          });

          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
          }).addTo(map);

          // Özel ISS İkonu
          const issIcon = L.divIcon({
            html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); transform: translate(-13px, -13px);">🛰️</div>',
            className: 'custom-iss-icon',
            iconSize: [26, 26]
          });

          issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);
          pathLine = L.polyline([], { color: '#fa520f', weight: 2, dashArray: '4, 4' }).addTo(map);
        }

        async function fetchIssPosition() {
          try {
            const res = await fetch('/api/iss/now');
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Veri alınamadı');

            const lat = data.latitude;
            const lon = data.longitude;
            currentPos = [lat, lon];

            // İstatistikleri Güncelle
            document.getElementById('stat-lat').innerText = Math.abs(lat).toFixed(4) + '°';
            document.getElementById('stat-lat-dir').innerText = lat >= 0 ? 'Kuzey Yarımküre' : 'Güney Yarımküre';

            document.getElementById('stat-lon').innerText = Math.abs(lon).toFixed(4) + '°';
            document.getElementById('stat-lon-dir').innerText = lon >= 0 ? 'Doğu Boylamı' : 'Batı Boylamı';

            document.getElementById('stat-speed').innerText = Number(data.velocity).toLocaleString('tr-TR');
            document.getElementById('stat-alt').innerText = data.altitude + ' km';
            document.getElementById('stat-footprint').innerText = '~' + data.footprint + ' km';
            document.getElementById('lbl-visibility').innerText = data.visibility === 'daylight' ? 'Güneş Işığında' : 'Dünya Gölgesinde';

            // Harita Marker & Rota Güncelle
            if (issMarker) {
              issMarker.setLatLng([lat, lon]);
              issPath.push([lat, lon]);
              if (issPath.length > 30) issPath.shift();
              pathLine.setLatLngs(issPath);
            }

            document.getElementById('iss-last-update').innerText = '• ' + new Date().toLocaleTimeString('tr-TR');
          } catch(err) {
            document.getElementById('iss-status-text').innerText = 'Bağlantı Bekleniyor...';
          }
        }

        function centerOnIss() {
          if (map && currentPos[0] !== 0) {
            map.setView(currentPos, 4, { animate: true });
          }
        }

        document.addEventListener('DOMContentLoaded', () => {
          initMap();
          fetchIssPosition();
          pollTimer = setInterval(fetchIssPosition, 3000);
        });

        window.addEventListener('beforeunload', () => {
          if (pollTimer) clearInterval(pollTimer);
        });
