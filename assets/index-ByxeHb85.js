var A=s=>{throw TypeError(s)};var P=(s,t,e)=>t.has(s)||A("Cannot "+e);var g=(s,t,e)=>(P(s,t,"read from private field"),e?e.call(s):t.get(s)),x=(s,t,e)=>t.has(s)?A("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(s):t.set(s,e),I=(s,t,e,r)=>(P(s,t,"write to private field"),r?r.call(s,e):t.set(s,e),e),_=(s,t,e)=>(P(s,t,"access private method"),e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function e(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(o){if(o.ep)return;o.ep=!0;const i=e(o);fetch(o.href,i)}})();const O={BASE_URL:"https://story-api.dicoding.dev/v1",VAPID_PUBLIC_KEY:"BOSnAf_MsqMRlkQsXPliiAXLd7JtH13-YbDA-2n9ZTacYtkQ01HtTAjFl7r_9BSBhVn3UB47cSdlkrCbHiaZtAM"},T=O.BASE_URL.replace(/\/$/,"");async function j({token:s=null,page:t=1,size:e=20,location:r=1}={}){const o=`${T}/stories?page=${t}&size=${e}&location=${r}`,i={};return s&&(i.Authorization=`Bearer ${s}`),await(await fetch(o,{headers:i})).json()}async function R({token:s=null,description:t="",file:e=null,lat:r=null,lon:o=null}={}){const i=!!s,n=i?`${T}/stories`:`${T}/stories/guest`,p=new FormData;p.append("description",t),e&&p.append("photo",e,e.name||"photo.jpg"),r!=null&&p.append("lat",String(r)),o!=null&&p.append("lon",String(o));const l={};return i&&(l.Authorization=`Bearer ${s}`),await(await fetch(n,{method:"POST",headers:l,body:p})).json()}async function M({name:s,email:t,password:e}={}){const r=`${T}/register`;return await(await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:s,email:t,password:e})})).json()}async function U({email:s,password:t}={}){const e=`${T}/login`;return await(await fetch(e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:s,password:t})})).json()}async function H(){return O.VAPID_PUBLIC_KEY}async function q({token:s=null,subscription:t}={}){return{error:!0,message:"SUBSCRIBE_ENDPOINT not configured. Register subscriptions server-side."}}const F="storymap-db",z=1,S="savedStories",D="outbox";function B(){return new Promise((s,t)=>{const e=indexedDB.open(F,z);e.onupgradeneeded=r=>{const o=r.target.result;o.objectStoreNames.contains(S)||o.createObjectStore(S,{keyPath:"id"}),o.objectStoreNames.contains(D)||o.createObjectStore(D,{autoIncrement:!0})},e.onsuccess=()=>s(e.result),e.onerror=()=>t(e.error)})}async function V(s){const t=await B();return new Promise((e,r)=>{const o=t.transaction(S,"readwrite");o.objectStore(S).put(s),o.oncomplete=()=>e(!0),o.onerror=()=>r(o.error)})}async function W(){const s=await B();return new Promise((t,e)=>{const i=s.transaction(S,"readonly").objectStore(S).getAll();i.onsuccess=()=>t(i.result||[]),i.onerror=()=>e(i.error)})}async function Y(s){const t=await B();return new Promise((e,r)=>{const o=t.transaction(S,"readwrite");o.objectStore(S).delete(s),o.oncomplete=()=>e(!0),o.onerror=()=>r(o.error)})}class N{constructor(){this._map=null,this._markers=[]}async render(){return`
      <section class="container">
        <h1>Map Page</h1>
        <div class="map-list">
          <div id="map" class="map"></div>
          <div id="story-list" class="list"></div>
        </div>
      </section>
    `}async afterRender(){const t=localStorage.getItem("authToken")||null;if(!t){const l=document.getElementById("story-list");l.innerHTML='<p>You need to <a href="#/login">login</a> to view stories on the map.</p>';return}let e;try{const l=await j({token:t,page:1,size:50,location:1});l&&l.error===!1&&Array.isArray(l.listStory)?e=l.listStory:(e=[],console.warn("Failed to fetch stories or no stories with location available",l))}catch(l){console.error("Error fetching stories",l),e=[]}if(typeof L>"u"){const l=document.getElementById("story-list");l.innerHTML="<p>Leaflet library not loaded. Check internet connection.</p>";return}this._map=L.map("map").setView([0,0],2);const r=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors"}),o=L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{attribution:"&copy; CartoDB"});r.addTo(this._map);const i={OpenStreetMap:r,"Carto Light":o};L.control.layers(i).addTo(this._map);const n=document.getElementById("story-list");if(n.innerHTML="",!e.length){n.innerHTML="<p>No story with location available or failed to fetch. If the API requires authentication, please provide a token in the app (localStorage key: authToken) or login first.</p>";return}const p=[];e.forEach((l,w)=>{const m=Number(l.lat),c=Number(l.lon);if(Number.isFinite(m)&&Number.isFinite(c)){const d=L.marker([m,c]).addTo(this._map),u=`
          <div style="min-width:150px">
            <img src="${l.photoUrl}" alt="${l.name}" style="width:100%;height:auto;margin-bottom:8px;" />
            <strong>${l.name}</strong>
            <p style="font-size:0.9rem">${new Date(l.createdAt).toLocaleString()}</p>
            <p>${l.description}</p>
          </div>
        `;d.bindPopup(u),this._markers.push(d),p.push([m,c]);const a=document.createElement("button");a.className="story-item",a.type="button",a.style.display="block",a.style.textAlign="left",a.style.width="100%",a.style.padding="8px",a.style.border="0",a.style.borderBottom="1px solid #eee",a.style.cursor="pointer",a.setAttribute("aria-label",`Open story ${l.name}`),a.innerHTML=`
          <div style="display:flex;gap:8px;align-items:center">
            <img src="${l.photoUrl}" alt="${l.name}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;" />
            <div>
              <div style="font-weight:bold">${l.name}</div>
              <div style="font-size:0.85rem;color:#666">${new Date(l.createdAt).toLocaleDateString()}</div>
              <div style="font-size:0.9rem;margin-top:4px">${l.description}</div>
            </div>
          </div>
        `;const f=()=>{this._markers.forEach(b=>b.closePopup()),d.openPopup(),d.setZIndexOffset(1e3),this._map.setView([m,c],12)};a.addEventListener("click",()=>{f(),a.style.background="#f0f8ff",setTimeout(()=>a.style.background="",1e3)});const h=document.createElement("button");h.type="button",h.textContent="Save Offline",h.style.marginTop="8px",h.style.padding="8px 10px",h.style.borderRadius="6px",h.style.border="1px solid #e5e7eb",h.style.background="#fff",h.onclick=async()=>{try{const b={id:l.id||`${Date.now()}-${w}`,name:l.name,description:l.description,photoUrl:l.photoUrl,lat:l.lat,lon:l.lon,createdAt:l.createdAt};await V(b),window.showToast&&window.showToast("Story saved for offline")}catch(b){console.error("save offline error",b),window.showToast&&window.showToast("Failed to save story")}};const C=document.createElement("div");C.style.marginTop="8px",C.appendChild(h),a.appendChild(C),a.addEventListener("keydown",b=>{(b.key==="Enter"||b.key===" ")&&(b.preventDefault(),f(),a.focus())}),n.appendChild(a)}}),p.length>0&&this._map.fitBounds(p,{padding:[40,40]})}}class K{constructor(){this._map=null,this._selectedLat=null,this._selectedLon=null,this._cameraStream=null}async render(){return`
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
    `}async afterRender(){const t=document.getElementById("add-story-form"),e=document.getElementById("photo"),r=document.getElementById("camera-button"),o=document.getElementById("camera-preview"),i=document.getElementById("coords"),n=document.getElementById("form-message");if(!(localStorage.getItem("authToken")||null)){n.style.color="red",n.innerHTML='You need to <a href="#/login">login</a> to add a story.';return}if(typeof L>"u"){n.style.color="red",n.textContent="Leaflet library not loaded.";return}this._map=L.map("map-add").setView([0,0],2),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(this._map);let l=null;this._map.on("click",w=>{const{lat:m,lng:c}=w.latlng;this._selectedLat=m,this._selectedLon=c,i.textContent=`Lat: ${m.toFixed(6)}, Lon: ${c.toFixed(6)}`,l?l.setLatLng([m,c]):l=L.marker([m,c]).addTo(this._map)}),r.addEventListener("click",async()=>{if(this._cameraStream){this._cameraStream.getTracks().forEach(w=>w.stop()),this._cameraStream=null,o.innerHTML="",r.textContent="Use Camera",r.setAttribute("aria-pressed","true");return}try{const w=await navigator.mediaDevices.getUserMedia({video:!0});this._cameraStream=w;const m=document.createElement("video");m.autoplay=!0,m.playsInline=!0,m.srcObject=w,m.style.maxWidth="100%",m.setAttribute("aria-label","Camera preview — click to capture"),o.innerHTML="",o.appendChild(m),r.textContent="Stop Camera (capture will use file input)",r.setAttribute("aria-pressed","true"),m.addEventListener("click",async()=>{const c=document.createElement("canvas");c.width=m.videoWidth,c.height=m.videoHeight,c.getContext("2d").drawImage(m,0,0);const u=await new Promise(h=>c.toBlob(h,"image/jpeg",.9)),a=new DataTransfer,f=new File([u],"capture.jpg",{type:"image/jpeg"});a.items.add(f),e.files=a.files,n.style.color="green",n.textContent="Captured image from camera and set as photo input.",n.setAttribute("role","status"),window.showToast&&window.showToast("Captured image from camera")})}catch(w){n.style.color="red",n.textContent="Failed to access camera: "+w.message,n.setAttribute("role","alert"),window.showToast&&window.showToast(n.textContent)}}),t.addEventListener("submit",async w=>{w.preventDefault(),n.style.color="green",n.textContent="";const m=document.getElementById("description").value.trim(),c=e.files&&e.files[0]?e.files[0]:null;if(!m){n.style.color="red",n.textContent="Description is required.";return}if(!c){n.style.color="red",n.textContent="Photo is required.";return}if(!this._selectedLat||!this._selectedLon){n.style.color="red",n.textContent="Please pick a location on the map.";return}if(c.size>1e6){n.style.color="red",n.textContent="Photo must be less than 1MB.";return}const d=localStorage.getItem("authToken")||null;try{const u=await R({token:d,description:m,file:c,lat:this._selectedLat,lon:this._selectedLon});u&&u.error===!1?(n.style.color="green",n.textContent="Story uploaded successfully.",window.showToast&&window.showToast("Story uploaded successfully"),t.reset(),this._cameraStream&&(this._cameraStream.getTracks().forEach(a=>a.stop()),this._cameraStream=null,o.innerHTML="")):(n.style.color="red",n.textContent=u&&u.message||"Failed to upload story.",window.showToast&&window.showToast(n.textContent))}catch(u){n.style.color="red",n.textContent="Error uploading story: "+u.message,window.showToast&&window.showToast(n.textContent)}})}}class J{async render(){return`
      <section class="auth-container">
        <div class="auth-card">
          <h2 class="auth-title">Welcome back</h2>
          <p class="auth-sub">Login to continue to the app</p>
          <form id="login-form">
            <div class="form-row">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div class="form-row">
              <label for="password">Password</label>
              <input id="password" name="password" type="password" required />
            </div>
            <div class="form-row">
              <button type="submit" class="auth-button">Login</button>
            </div>
            <div id="login-message" role="status" aria-live="polite" class="form-message"></div>
          </form>
        </div>
      </section>
    `}async afterRender(){const t=document.getElementById("login-form"),e=document.getElementById("login-message");t.addEventListener("submit",async r=>{r.preventDefault(),e.textContent="";const o=document.getElementById("email").value.trim(),i=document.getElementById("password").value;try{const n=await U({email:o,password:i});n&&n.error===!1&&n.loginResult&&n.loginResult.token?(localStorage.setItem("authToken",n.loginResult.token),n.loginResult.name&&localStorage.setItem("authName",n.loginResult.name),n.loginResult.userId&&localStorage.setItem("authUserId",n.loginResult.userId),e.style.color="green",e.textContent="Login successful. Token saved.",window.showToast&&window.showToast("Login successful"),window.dispatchEvent(new Event("authchange")),location.hash="#/"):(e.style.color="red",e.textContent=n&&n.message||"Login failed",window.showToast&&window.showToast(e.textContent))}catch(n){e.style.color="red",e.textContent="Login error: "+n.message}})}}class X{async render(){return`
      <section class="auth-container">
        <div class="auth-card">
          <h2 class="auth-title">Create account</h2>
          <p class="auth-sub">Register a new account to post stories</p>
          <form id="register-form">
            <div class="form-row">
              <label for="name">Full name</label>
              <input id="name" name="name" type="text" required />
            </div>
            <div class="form-row">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div class="form-row">
              <label for="password">Password</label>
              <input id="password" name="password" type="password" required minlength="8" />
            </div>
            <div class="form-row">
              <button type="submit" class="auth-button">Register</button>
            </div>
            <div id="register-message" role="status" aria-live="polite" class="form-message"></div>
          </form>
        </div>
      </section>
    `}async afterRender(){const t=document.getElementById("register-form"),e=document.getElementById("register-message");t.addEventListener("submit",async r=>{r.preventDefault(),e.textContent="";const o=document.getElementById("name").value.trim(),i=document.getElementById("email").value.trim(),n=document.getElementById("password").value;try{const p=await M({name:o,email:i,password:n});p&&p.error===!1?(e.style.color="green",e.textContent="Registration successful. You can now login.",window.showToast&&window.showToast("Registration successful")):(e.style.color="red",e.textContent=p&&p.message||"Registration failed",window.showToast&&window.showToast(e.textContent))}catch(p){e.style.color="red",e.textContent="Registration error: "+p.message}})}}class Z{async render(){return`
      <section class="container">
        <h1>Profile</h1>
        <div id="profile-info"></div>
      </section>
    `}async afterRender(){const t=document.getElementById("profile-info"),e=localStorage.getItem("authName"),r=localStorage.getItem("authUserId");if(!localStorage.getItem("authToken")){t.innerHTML='<p>You are not logged in. <a href="#/login">Login</a></p>';return}t.innerHTML=`
      <p><strong>Name:</strong> ${e||"-"} </p>
      <p><strong>User ID:</strong> ${r||"-"} </p>
      <div style="margin-top:12px">
        <button id="logout-button">Logout</button>
      </div>
    `,document.getElementById("logout-button").addEventListener("click",()=>{localStorage.removeItem("authToken"),localStorage.removeItem("authName"),localStorage.removeItem("authUserId"),window.dispatchEvent(new Event("authchange")),window.showToast&&window.showToast("Logged out"),window.location.hash="#/login"})}}class G{async render(){return`
      <section class="container">
        <h1>Saved Stories (Offline)</h1>
        <div id="saved-list" class="list"></div>
      </section>
    `}async afterRender(){const t=document.getElementById("saved-list");t.innerHTML="<p>Loading saved stories…</p>";try{const e=await W();if(!e.length){t.innerHTML="<p>No saved stories yet.</p>";return}t.innerHTML="",e.forEach(r=>{const o=document.createElement("div");o.className="saved-item",o.style.padding="8px",o.style.borderBottom="1px solid #eee",o.innerHTML=`
          <div style="display:flex;gap:8px;align-items:center">
            <img src="${r.photoUrl}" alt="${r.name}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;" />
            <div>
              <div style="font-weight:bold">${r.name}</div>
              <div style="font-size:0.85rem;color:#666">${new Date(r.createdAt).toLocaleString()}</div>
              <div style="margin-top:6px">${r.description}</div>
            </div>
          </div>
        `;const i=document.createElement("div");i.style.marginTop="8px";const n=document.createElement("button");n.textContent="Delete",n.onclick=async()=>{await Y(r.id),window.showToast&&window.showToast("Deleted saved story"),o.remove()},i.appendChild(n),o.appendChild(i),t.appendChild(o)})}catch(e){console.error("load saved error",e),t.innerHTML="<p>Failed to load saved stories.</p>"}}}const Q={"/":new N,"/map":new N,"/add":new K,"/saved":new G,"/login":new J,"/register":new X,"/profile":new Z};function ee(s){const t=s.split("/");return{resource:t[1]||null,id:t[2]||null}}function te(s){let t="";return s.resource&&(t=t.concat(`/${s.resource}`)),s.id&&(t=t.concat("/:id")),t||"/"}function oe(){return location.hash.replace("#","")||"/"}function ne(){const s=oe(),t=ee(s);return te(t)}var E,y,v,k,$;class re{constructor({navigationDrawer:t,drawerButton:e,content:r}){x(this,k);x(this,E,null);x(this,y,null);x(this,v,null);I(this,E,r),I(this,y,e),I(this,v,t),_(this,k,$).call(this)}async renderPage(){if(!g(this,E))return;const t=document.querySelector("video");t&&t.srcObject&&(t.srcObject.getTracks().forEach(p=>p.stop()),t.srcObject=null);const e=ne(),r=Q[e],o=document.createElement("div");o.className="page page-enter",o.innerHTML=await r.render();const i=g(this,E).querySelector(".page");g(this,E).appendChild(o),o.classList.add("page-enter-active");const n=350;i&&(i.classList.add("page-exit"),setTimeout(()=>{i.parentElement&&i.remove()},n)),await new Promise(p=>setTimeout(p,n)),await r.afterRender()}}E=new WeakMap,y=new WeakMap,v=new WeakMap,k=new WeakSet,$=function(){if(g(this,y)&&g(this,v)){g(this,y).setAttribute("aria-controls",g(this,v).id||"navigation-drawer"),g(this,y).setAttribute("aria-expanded","false");const t=()=>{const e=g(this,v).classList.toggle("open");g(this,y).setAttribute("aria-expanded",String(e))};g(this,y).addEventListener("click",t),g(this,y).addEventListener("keydown",e=>{(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),t())}),document.body.addEventListener("click",e=>{!g(this,v).contains(e.target)&&!g(this,y).contains(e.target)&&g(this,v).classList.remove("open"),g(this,v).querySelectorAll("a").forEach(r=>{r.contains(e.target)&&g(this,v).classList.remove("open")})})}};document.addEventListener("DOMContentLoaded",async()=>{const s=new re({content:document.querySelector("#main-content"),drawerButton:document.querySelector("#drawer-button"),navigationDrawer:document.querySelector("#navigation-drawer")});function t(){const c=localStorage.getItem("authToken"),d=["nav-map","nav-add","nav-profile"],u=["nav-login","nav-register"];d.forEach(a=>{const f=document.getElementById(a);f&&(f.style.display=c?"":"none")}),u.forEach(a=>{const f=document.getElementById(a);f&&(f.style.display=c?"none":"")})}function e(){const c=localStorage.getItem("authName"),d=document.getElementById("user-name"),u=document.getElementById("user-avatar"),a=document.getElementById("logout-button-header");d&&(d.textContent=c?`Hi, ${c}`:""),u&&(u.textContent=c?c[0].toUpperCase():""),a&&(a.style.display=localStorage.getItem("authToken")?"":"none"),a&&(a.onclick=()=>{localStorage.removeItem("authToken"),localStorage.removeItem("authName"),localStorage.removeItem("authUserId"),window.dispatchEvent(new Event("authchange")),window.showToast&&window.showToast("Logged out")})}function r(c,d=3500){const u=document.getElementById("toast-container");if(!u)return;const a=document.createElement("div");a.className="toast",a.textContent=c,u.appendChild(a),setTimeout(()=>{a.remove()},d)}window.showToast=r,e(),t();const o=document.getElementById("push-toggle");function i(c){const d="=".repeat((4-c.length%4)%4),u=(c+d).replace(/-/g,"+").replace(/_/g,"/"),a=atob(u),f=new Uint8Array(a.length);for(let h=0;h<a.length;++h)f[h]=a.charCodeAt(h);return f}async function n(){if(!("serviceWorker"in navigator))return null;try{try{const d=await fetch("/sw.js",{cache:"no-store"});if(!d.ok)throw new Error(`sw.js not reachable (status ${d.status})`);const u=d.headers.get("content-type")||"";if(!/javascript|application\/octet-stream|text\/javascript|application\/javascript/i.test(u))throw new Error(`sw.js served with unexpected Content-Type: ${u}`)}catch(d){throw console.error("SW preflight fetch failed",d),d}return await navigator.serviceWorker.register("/sw.js")}catch(c){return console.error("SW register error",c),null}}async function p(){if(!("Notification"in window)){r("Push notifications are not supported in this browser");return}if(await Notification.requestPermission()!=="granted"){r("Notification permission denied");return}const d=await n();if(!d){r("Service Worker registration failed");return}const u=await H();if(!u){r("VAPID public key not available from Dicoding API. Please configure CONFIG.VAPID_ENDPOINT to the correct Dicoding endpoint (no dummy keys).");return}try{const a=await d.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:i(u)});localStorage.setItem("pushSubscription",JSON.stringify(a)),localStorage.setItem("pushSubscribed","1"),o&&(o.textContent="Disable Push"),r("Subscribed to push notifications");const f=localStorage.getItem("authToken");try{await q({token:f,subscription:a})}catch{}}catch(a){console.error("subscribe error",a),r("Failed to subscribe to push: "+a.message)}}async function l(){const c=await n();if(!c)return;const d=await c.pushManager.getSubscription();if(!d){localStorage.removeItem("pushSubscription"),localStorage.removeItem("pushSubscribed"),o&&(o.textContent="Enable Push"),r("No push subscription found");return}try{await d.unsubscribe(),localStorage.removeItem("pushSubscription"),localStorage.removeItem("pushSubscribed"),o&&(o.textContent="Enable Push"),r("Push subscription removed")}catch(u){console.error("unsubscribe error",u),r("Failed to unsubscribe: "+u.message)}}if(o){const c=localStorage.getItem("pushSubscribed")==="1";o.textContent=c?"Disable Push":"Enable Push",o.onclick=async()=>{localStorage.getItem("pushSubscribed")==="1"?await l():await p()},"serviceWorker"in navigator&&n().then(()=>{})}localStorage.getItem("authToken")||location.hash!=="#/login"&&location.hash!=="#/register"&&(location.hash="#/login"),window.addEventListener("authchange",()=>{t(),localStorage.getItem("authToken")||(location.hash="#/login"),e()});const m=document.querySelector(".skip-link");m&&m.addEventListener("click",c=>{c.preventDefault();const d=document.getElementById("main-content");d&&(d.setAttribute("tabindex","-1"),d.focus())}),await s.renderPage(),window.addEventListener("hashchange",async()=>{await s.renderPage()})});
