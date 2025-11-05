import { getStories } from "../../data/api";
import { saveStory } from '../../utils/idb';

export default class MapPage {
  constructor() {
    this._map = null;
    this._markers = [];
  }

  async render() {
    return `
      <section class="container">
        <h1>Map Page</h1>
        <div class="map-list">
          <div id="map" class="map"></div>
          <div id="story-list" class="list"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const token = localStorage.getItem("authToken") || null;

    if (!token) {
      const listEl = document.getElementById("story-list");
      listEl.innerHTML = `<p>You need to <a href="#/login">login</a> to view stories on the map.</p>`;
      return;
    }

    let data;
    try {
      const res = await getStories({ token, page: 1, size: 50, location: 1 });
      if (res && res.error === false && Array.isArray(res.listStory)) {
        data = res.listStory;
      } else {
        data = [];
        console.warn(
          "Failed to fetch stories or no stories with location available",
          res
        );
      }
    } catch (err) {
      console.error("Error fetching stories", err);
      data = [];
    }

    // Initialize map (Leaflet must be loaded via global L)
    if (typeof L === "undefined") {
      const el = document.getElementById("story-list");
      el.innerHTML =
        "<p>Leaflet library not loaded. Check internet connection.</p>";
      return;
    }

    // Ensure the map container element exists in the DOM. Sometimes
    // the view transition / DOM swap can race with map initialization,
    // causing Leaflet to throw "Map container not found.". Try a few
    // short retries and then initialize with the actual element.
    const getMapEl = () => document.getElementById('map');
    let mapEl = getMapEl();
    const maxRetries = 8;
    let attempt = 0;
    while (!mapEl && attempt < maxRetries) {
      // small delay to allow DOM to settle (50ms * up to 8 = 400ms)
      // this avoids blocking UI for long while being resilient.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 50));
      mapEl = getMapEl();
      attempt += 1;
    }

    if (!mapEl) {
      const el = document.getElementById('story-list') || document.getElementById('main-content') || document.body;
      el.innerHTML = '<p>Map container not found in the document. Please refresh the page.</p>';
      console.error('Map container (#map) not found after retries. Aborting map initialization.');
      return;
    }

    // Initialize map with the element reference to avoid Leaflet resolving
    // the element by id internally (more robust in race scenarios).
    this._map = L.map(mapEl).setView([0, 0], 2);

    // Tile layers: OSM and Carto (two layers for control)
    const osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      }
    );

    const carto = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "&copy; CartoDB",
      }
    );

    osm.addTo(this._map);

    const baseMaps = {
      OpenStreetMap: osm,
      "Carto Light": carto,
    };

    L.control.layers(baseMaps).addTo(this._map);

    // Create markers and list
    const listEl = document.getElementById("story-list");
    listEl.innerHTML = "";

    if (!data.length) {
      listEl.innerHTML =
        "<p>No story with location available or failed to fetch. If the API requires authentication, please provide a token in the app (localStorage key: authToken) or login first.</p>";
      return;
    }

    const bounds = [];

    data.forEach((story, idx) => {
      const lat = Number(story.lat);
      const lon = Number(story.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        const marker = L.marker([lat, lon]).addTo(this._map);

        const popupHtml = `
          <div style="min-width:150px">
            <img src="${story.photoUrl}" alt="${
          story.name
        }" style="width:100%;height:auto;margin-bottom:8px;" />
            <strong>${story.name}</strong>
            <p style="font-size:0.9rem">${new Date(
              story.createdAt
            ).toLocaleString()}</p>
            <p>${story.description}</p>
          </div>
        `;

        marker.bindPopup(popupHtml);
        this._markers.push(marker);
        bounds.push([lat, lon]);

        // Add accessible list item as button
        const item = document.createElement("button");
        item.className = "story-item";
        item.type = "button";
        item.style.display = "block";
        item.style.textAlign = "left";
        item.style.width = "100%";
        item.style.padding = "8px";
        item.style.border = "0";
        item.style.borderBottom = "1px solid #eee";
        item.style.cursor = "pointer";
        item.setAttribute("aria-label", `Open story ${story.name}`);
        item.innerHTML = `
          <div style="display:flex;gap:8px;align-items:center">
            <img src="${story.photoUrl}" alt="${
          story.name
        }" style="width:64px;height:64px;object-fit:cover;border-radius:6px;" />
            <div>
              <div style="font-weight:bold">${story.name}</div>
              <div style="font-size:0.85rem;color:#666">${new Date(
                story.createdAt
              ).toLocaleDateString()}</div>
              <div style="font-size:0.9rem;margin-top:4px">${
                story.description
              }</div>
            </div>
          </div>
        `;

        const openMarker = () => {
          this._markers.forEach((m) => m.closePopup());
          marker.openPopup();
          marker.setZIndexOffset(1000);
          this._map.setView([lat, lon], 12);
        };

        item.addEventListener("click", () => {
          openMarker();
          item.style.background = "#f0f8ff";
          setTimeout(() => (item.style.background = ""), 1000);
        });

        // Save offline button
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.textContent = 'Save Offline';
        saveBtn.style.marginTop = '8px';
        saveBtn.style.padding = '8px 10px';
        saveBtn.style.borderRadius = '6px';
        saveBtn.style.border = '1px solid #e5e7eb';
        saveBtn.style.background = '#fff';
        saveBtn.onclick = async () => {
          try {
            const toSave = {
              id: story.id || `${Date.now()}-${idx}`,
              name: story.name,
              description: story.description,
              photoUrl: story.photoUrl,
              lat: story.lat,
              lon: story.lon,
              createdAt: story.createdAt,
            };
            await saveStory(toSave);
            if (window.showToast) window.showToast('Story saved for offline');
          } catch (err) {
            console.error('save offline error', err);
            if (window.showToast) window.showToast('Failed to save story');
          }
        };

        // append save button below item
        const btnWrap = document.createElement('div');
        btnWrap.style.marginTop = '8px';
        btnWrap.appendChild(saveBtn);
        item.appendChild(btnWrap);

        item.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openMarker();
            item.focus();
          }
        });

        listEl.appendChild(item);
      }
    });

    if (bounds.length > 0) {
      this._map.fitBounds(bounds, { padding: [40, 40] });
    }
  }
}
