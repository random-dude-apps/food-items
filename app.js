(() => {
  'use strict';

  const homeView = document.getElementById('home-view');
  const recipesView = document.getElementById('recipes-view');
  const loading = document.getElementById('loading');
  const backBtn = document.getElementById('back-btn');
  const detailToggle = document.getElementById('detail-toggle');
  const listToggle = document.getElementById('list-toggle');
  const categoryTitle = document.getElementById('category-title');
  const recipeCount = document.getElementById('recipe-count');
  const recipesContainer = document.getElementById('recipes-container');
  const scrollTopBtn = document.getElementById('scroll-top-btn');

  const CATEGORY_LABELS = {
    breakfast: 'नाश्ता',
    lunch: 'दोपहर का भोजन',
    dinner: 'रात का भोजन',
    fullday: 'पूरे दिन का भोजन'
  };

  const MEAL_LABELS = {
    breakfast: 'नाश्ता',
    lunch: 'दोपहर',
    dinner: 'रात'
  };

  const recipes = { breakfast: [], lunch: [], dinner: [] };
  let currentCategory = null;
  let currentMode = 'detail';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  async function loadRecipes() {
    try {
      const res = await fetch('recipes.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      data.forEach(r => {
        const prefix = (r.id || '').charAt(0).toUpperCase();
        if (prefix === 'B') recipes.breakfast.push(r);
        else if (prefix === 'L') recipes.lunch.push(r);
        else if (prefix === 'D') recipes.dinner.push(r);
      });
      loading.classList.add('hidden');
    } catch (e) {
      loading.classList.add('error');
      loading.innerHTML = 'क्षमा करें — भोजन सूची लोड नहीं हो सकी।<br>कृपया इंटरनेट जाँचें और पृष्ठ फिर से खोलें।';
    }
  }

  function showView(which) {
    if (which === 'home') {
      homeView.classList.remove('hidden');
      recipesView.classList.add('hidden');
    } else {
      homeView.classList.add('hidden');
      recipesView.classList.remove('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function recipeCardHtml(r, numberPrefix) {
    const heading = numberPrefix ? `${numberPrefix}. ${escapeHtml(r.name)}` : escapeHtml(r.name);
    const notes = r.notes ? `<div class="recipe-notes">${escapeHtml(r.notes)}</div>` : '';
    const ingredients = (r.ingredients && r.ingredients.length)
      ? `<h4>सामग्री</h4><ul>${r.ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
      : '';
    const instructions = (r.instruction && r.instruction.length)
      ? `<h4>बनाने की विधि</h4><ol>${r.instruction.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ol>`
      : '';
    return `
      <article class="recipe-card" id="recipe-${escapeHtml(r.id)}" data-id="${escapeHtml(r.id)}">
        <h3>${heading}</h3>
        ${notes}
        ${ingredients}
        ${instructions}
      </article>
    `;
  }

  function listHtml(list) {
    const items = list.map((r, i) => `
      <button class="recipe-list-item" data-id="${escapeHtml(r.id)}" type="button">
        <span class="item-number">${i + 1}</span>
        <span class="item-name">${escapeHtml(r.name)}</span>
      </button>
    `).join('');
    return `<div class="recipe-list">${items}</div>`;
  }

  function renderCategory(category) {
    currentCategory = category;
    categoryTitle.textContent = CATEGORY_LABELS[category];

    if (category === 'fullday') {
      const count = Math.min(
        recipes.breakfast.length,
        recipes.lunch.length,
        recipes.dinner.length
      );
      recipeCount.textContent = `${count} दिन`;
      if (currentMode === 'detail') {
        renderFullDayDetail(count);
      } else {
        renderFullDayList(count);
      }
    } else {
      const list = recipes[category] || [];
      recipeCount.textContent = `${list.length} व्यंजन`;
      if (currentMode === 'detail') {
        recipesContainer.innerHTML = list.map((r, i) => recipeCardHtml(r, i + 1)).join('');
      } else {
        recipesContainer.innerHTML = listHtml(list);
      }
    }
  }

  function renderFullDayDetail(count) {
    const parts = [];
    for (let i = 0; i < count; i++) {
      parts.push(`
        <section class="day-section">
          <h2>दिन ${i + 1}</h2>
          <div class="meal-heading">${MEAL_LABELS.breakfast}</div>
          ${recipeCardHtml(recipes.breakfast[i])}
          <div class="meal-heading">${MEAL_LABELS.lunch}</div>
          ${recipeCardHtml(recipes.lunch[i])}
          <div class="meal-heading">${MEAL_LABELS.dinner}</div>
          ${recipeCardHtml(recipes.dinner[i])}
        </section>
      `);
    }
    recipesContainer.innerHTML = parts.join('');
  }

  function renderFullDayList(count) {
    const mealRow = (mealKey, recipe) => `
      <button class="recipe-list-item meal-${mealKey}" data-id="${escapeHtml(recipe.id)}" type="button">
        <span class="meal-tag">${MEAL_LABELS[mealKey]}</span>
        <span class="item-name">${escapeHtml(recipe.name)}</span>
      </button>
    `;
    const parts = [];
    for (let i = 0; i < count; i++) {
      parts.push(`
        <div class="day-list-group">
          <div class="day-list-label">दिन ${i + 1}</div>
          ${mealRow('breakfast', recipes.breakfast[i])}
          ${mealRow('lunch', recipes.lunch[i])}
          ${mealRow('dinner', recipes.dinner[i])}
        </div>
      `);
    }
    recipesContainer.innerHTML = `<div class="recipe-list">${parts.join('')}</div>`;
  }

  function setMode(mode) {
    if (mode === currentMode) return;
    currentMode = mode;
    detailToggle.classList.toggle('active', mode === 'detail');
    listToggle.classList.toggle('active', mode === 'list');
    detailToggle.setAttribute('aria-selected', mode === 'detail');
    listToggle.setAttribute('aria-selected', mode === 'list');
    if (currentCategory) renderCategory(currentCategory);
  }

  function flashRecipe(id) {
    const target = document.getElementById(`recipe-${id}`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('highlight');
    setTimeout(() => target.classList.remove('highlight'), 1500);
  }

  document.querySelectorAll('.category-card').forEach(btn => {
    btn.addEventListener('click', () => {
      showView('recipes');
      currentMode = 'detail';
      detailToggle.classList.add('active');
      listToggle.classList.remove('active');
      detailToggle.setAttribute('aria-selected', 'true');
      listToggle.setAttribute('aria-selected', 'false');
      renderCategory(btn.dataset.category);
    });
  });

  backBtn.addEventListener('click', () => {
    showView('home');
    currentCategory = null;
    recipesContainer.innerHTML = '';
  });

  detailToggle.addEventListener('click', () => setMode('detail'));
  listToggle.addEventListener('click', () => setMode('list'));

  recipesContainer.addEventListener('click', e => {
    const item = e.target.closest('.recipe-list-item');
    if (!item) return;
    const id = item.dataset.id;
    if (currentMode === 'list') {
      setMode('detail');
      requestAnimationFrame(() => flashRecipe(id));
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  loadRecipes();
})();
