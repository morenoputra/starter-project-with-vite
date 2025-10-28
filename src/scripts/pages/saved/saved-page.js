import { getSavedStories, deleteSavedStory } from '../../utils/idb';

export default class SavedPage {
  async render() {
    return `
      <section class="container">
        <h1>Saved Stories (Offline)</h1>
        <div id="saved-list" class="list"></div>
      </section>
    `;
  }

  async afterRender() {
    const listEl = document.getElementById('saved-list');
    listEl.innerHTML = '<p>Loading saved stories…</p>';
    try {
      const items = await getSavedStories();
      if (!items.length) {
        listEl.innerHTML = '<p>No saved stories yet.</p>';
        return;
      }
      listEl.innerHTML = '';
      items.forEach((story) => {
        const item = document.createElement('div');
        item.className = 'saved-item';
        item.style.padding = '8px';
        item.style.borderBottom = '1px solid #eee';
        item.innerHTML = `
          <div style="display:flex;gap:8px;align-items:center">
            <img src="${story.photoUrl}" alt="${story.name}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;" />
            <div>
              <div style="font-weight:bold">${story.name}</div>
              <div style="font-size:0.85rem;color:#666">${new Date(story.createdAt).toLocaleString()}</div>
              <div style="margin-top:6px">${story.description}</div>
            </div>
          </div>
        `;
        const actions = document.createElement('div');
        actions.style.marginTop = '8px';
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.onclick = async () => {
          await deleteSavedStory(story.id);
          if (window.showToast) window.showToast('Deleted saved story');
          item.remove();
        };
        actions.appendChild(delBtn);
        item.appendChild(actions);
        listEl.appendChild(item);
      });
    } catch (err) {
      console.error('load saved error', err);
      listEl.innerHTML = '<p>Failed to load saved stories.</p>';
    }
  }
}
