import { postStory } from "../../data/api";

export default class AddStoryPage {
  constructor() {
    this._map = null;
    this._selectedLat = null;
    this._selectedLon = null;
    this._cameraStream = null;
  }

  async render() {
    return `
      <section class="container">
        <h1>Add Story</h1>
        <form id="add-story-form">
          <div>
            <label for="description">Description</label><br />
            <textarea id="description" name="description" rows="4" style="width:100%"></textarea>
          </div>
          <div style="margin-top:8px">
            <label for="photo">Photo (max 1MB)</label><br />
            <input id="photo" name="photo" type="file" accept="image/*" aria-label="Photo upload" />
            <button type="button" id="camera-button" aria-pressed="false">Use Camera</button>
            <div id="camera-preview" style="margin-top:8px"></div>
          </div>
          <div style="margin-top:8px">
            <div id="map-label" style="font-weight:600">Pick location by clicking on the map</div>
            <div id="map-add" style="height:40vh;margin-top:8px" role="application" aria-labelledby="map-label"></div>
            <div id="coords" style="margin-top:8px;color:#333" aria-live="polite">Lat: - , Lon: -</div>
          </div>
          <div style="margin-top:12px">
            <button type="submit">Submit</button>
          </div>
          <div id="form-message" style="margin-top:8px;color:green" role="status" aria-live="polite"></div>
        </form>
      </section>
    `;
  }

  async afterRender(pageElement) {
    const form = pageElement.querySelector("#add-story-form");
    const photoInput = pageElement.querySelector("#photo");
    const cameraButton = pageElement.querySelector("#camera-button");
    const cameraPreview = pageElement.querySelector("#camera-preview");
    const coordsEl = pageElement.querySelector("#coords");
    const messageEl = pageElement.querySelector("#form-message");
    const mapContainer = pageElement.querySelector("#map-add");

    if (!form || !mapContainer || !cameraButton || !photoInput) {
      console.error("Core elements for AddStoryPage not found!");
      return;
    }

    const token = localStorage.getItem("authToken") || null;
    if (!token) {
      messageEl.style.color = "red";
      messageEl.innerHTML = 'You need to <a href="#/login">login</a> to add a story.';
      return;
    }

    if (typeof L === "undefined") {
      messageEl.style.color = "red";
      messageEl.textContent = "Leaflet library not loaded.";
      return;
    }

    this._map = L.map(mapContainer).setView([0, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(this._map);

    let marker = null;
    this._map.on("click", (ev) => {
      const { lat, lng } = ev.latlng;
      this._selectedLat = lat;
      this._selectedLon = lng;
      coordsEl.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}`;
      if (marker) marker.setLatLng([lat, lng]);
      else marker = L.marker([lat, lng]).addTo(this._map);
    });

    cameraButton.addEventListener("click", async () => {
      if (this._cameraStream) {
        this._cameraStream.getTracks().forEach((t) => t.stop());
        this._cameraStream = null;
        cameraPreview.innerHTML = "";
        cameraButton.textContent = "Use Camera";
        cameraButton.setAttribute("aria-pressed", "false");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this._cameraStream = stream;
        const video = document.createElement("video");
        video.autoplay = true;
        video.playsInline = true;
        video.srcObject = stream;
        video.style.maxWidth = "100%";
        video.setAttribute("aria-label", "Camera preview — click to capture");
        cameraPreview.innerHTML = "";
        cameraPreview.appendChild(video);
        cameraButton.textContent = "Stop Camera (capture will use file input)";
        cameraButton.setAttribute("aria-pressed", "true");

        video.addEventListener("click", async () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0);
          const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
          const dt = new DataTransfer();
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          dt.items.add(file);
          photoInput.files = dt.files;
          messageEl.style.color = "green";
          messageEl.textContent = "Captured image from camera and set as photo input.";
          if (window.showToast) window.showToast("Captured image from camera");
        });
      } catch (err) {
        messageEl.style.color = "red";
        messageEl.textContent = "Failed to access camera: " + err.message;
        if (window.showToast) window.showToast(messageEl.textContent);
      }
    });

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      messageEl.style.color = "green";
      messageEl.textContent = "";

      const description = form.elements.description.value.trim();
      const file = photoInput.files && photoInput.files[0] ? photoInput.files[0] : null;

      if (!description) {
        messageEl.style.color = "red";
        messageEl.textContent = "Description is required.";
        return;
      }
      if (!file) {
        messageEl.style.color = "red";
        messageEl.textContent = "Photo is required.";
        return;
      }
      if (!this._selectedLat || !this._selectedLon) {
        messageEl.style.color = "red";
        messageEl.textContent = "Please pick a location on the map.";
        return;
      }
      if (file.size > 1_000_000) {
        messageEl.style.color = "red";
        messageEl.textContent = "Photo must be less than 1MB.";
        return;
      }

      try {
        const res = await postStory({
          token,
          description,
          file,
          lat: this._selectedLat,
          lon: this._selectedLon,
        });

        if (res && res.error === false) {
          messageEl.style.color = "green";
          messageEl.textContent = "Story uploaded successfully.";
          if (window.showToast) window.showToast("Story uploaded successfully");
          form.reset();
          if (this._cameraStream) {
            this._cameraStream.getTracks().forEach((t) => t.stop());
            this._cameraStream = null;
            cameraPreview.innerHTML = "";
          }
        } else {
          messageEl.style.color = "red";
          messageEl.textContent = (res && res.message) || "Failed to upload story.";
          if (window.showToast) window.showToast(messageEl.textContent);
        }
      } catch (err) {
        messageEl.style.color = "red";
        messageEl.textContent = "Error uploading story: " + err.message;
        if (window.showToast) window.showToast(messageEl.textContent);
      }
    });
  }
}
