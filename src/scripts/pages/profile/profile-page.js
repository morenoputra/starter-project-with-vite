export default class ProfilePage {
  async render() {
    return `
      <section class="container">
        <h1>Profile</h1>
        <div id="profile-info"></div>
      </section>
    `;
  }

  async afterRender() {
    const infoEl = document.getElementById('profile-info');
    const name = localStorage.getItem('authName');
    const userId = localStorage.getItem('authUserId');

    if (!localStorage.getItem('authToken')) {
      infoEl.innerHTML = '<p>You are not logged in. <a href="#/login">Login</a></p>';
      return;
    }

    infoEl.innerHTML = `
      <p><strong>Name:</strong> ${name || '-'} </p>
      <p><strong>User ID:</strong> ${userId || '-'} </p>
      <div style="margin-top:12px">
        <button id="logout-button">Logout</button>
      </div>
    `;

    document.getElementById('logout-button').addEventListener('click', () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authName');
      localStorage.removeItem('authUserId');
      // notify app
      window.dispatchEvent(new Event('authchange'));
      if (window.showToast) window.showToast('Logged out');
      // redirect to login
      window.location.hash = '#/login';
    });
  }
}
