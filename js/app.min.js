/**
 * shrinkwraps.co.uk - Main Application Logic
 * UI Redesign with Dark Green Palette & High Performance Trade Grid
 */

document.addEventListener('DOMContentLoaded', () => {
  renderCategoriesGrid();
  renderProductsGrid('bestseller');
  initTabsNav();
  initLiveSearch();
  initScrollTop();
  initMobileMenu();
});

/* Format Product Price Helper */
function getProductPriceDisplay(p) {
  if (p.priceRange && Array.isArray(p.priceRange) && p.priceRange.length === 2 && p.priceRange[0] !== p.priceRange[1]) {
    return `£${p.priceRange[0].toFixed(2)} - £${p.priceRange[1].toFixed(2)}`;
  }
  if (p.hasVariations && p.variations && p.variations.length > 0) {
    const prices = p.variations.map(v => v.price).filter(pr => typeof pr === 'number' && !isNaN(pr));
    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (min !== max) return `£${min.toFixed(2)} - £${max.toFixed(2)}`;
      return `£${min.toFixed(2)}`;
    }
  }
  const base = p.basePrice || p.price || 0;
  return `£${Number(base).toFixed(2)}`;
}

/* Render Homepage 8 Real Categories */
function renderCategoriesGrid() {
  const container = document.getElementById('categoriesGrid');
  if (!container || typeof CATEGORIES === 'undefined') return;

  container.innerHTML = CATEGORIES.map(cat => `
    <a href="shop.html?category=${cat.id}" class="category-card">
      <div class="category-thumb">
        <img src="${cat.image}" alt="${cat.name}" loading="lazy">
      </div>
      <div class="category-info">
        <h3>${cat.name}</h3>
        <span class="category-count"><i class="fas fa-box"></i> ${cat.count} Products</span>
      </div>
    </a>
  `).join('');
}

/* Render Best Selling / Tabbed Products */
function renderProductsGrid(tabFilter = 'bestseller') {
  const container = document.getElementById('productsGrid');
  if (!container || typeof PRODUCTS_DATA === 'undefined') return;

  let filteredProducts = [];

  if (tabFilter === 'all') {
    filteredProducts = PRODUCTS_DATA.slice(0, 12);
  } else if (tabFilter === 'bestseller' || tabFilter === 'best-seller' || tabFilter === 'best-offer') {
    filteredProducts = PRODUCTS_DATA.filter(p => p.tab === 'bestseller' || p.tab === 'best-seller' || p.tab === 'best-offer' || p.badge === 'BESTSELLER');
    if (filteredProducts.length < 8) {
      filteredProducts = PRODUCTS_DATA.slice(0, 8);
    }
  } else if (tabFilter === 'stretch-film' || tabFilter === 'mailing-bags' || tabFilter === 'tapes' || tabFilter === 'polythene' || tabFilter === 'royal-mail-pip-boxes') {
    filteredProducts = PRODUCTS_DATA.filter(p => p.category === tabFilter);
  } else {
    filteredProducts = PRODUCTS_DATA.filter(p => p.tab === tabFilter);
  }

  // Cap at 12 items for clean visual balance
  const displayItems = filteredProducts.slice(0, 12);

  container.innerHTML = displayItems.map(p => `
    <div class="product-card">
      ${p.badge ? `<div class="pill-badge pill-badge-${p.badge.toLowerCase()}"><span class="badge-dot"></span>${p.badge}</div>` : ''}
      <div class="product-thumb">
        <a href="product-detail.html?id=${p.id}">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </a>
      </div>
      <div class="product-details">
        <span class="product-cat">${(p.category || '').replace(/-/g, ' ')}</span>
        <h3 class="product-title">
          <a href="product-detail.html?id=${p.id}">${p.name}</a>
        </h3>
        <div class="product-rating">
          ${'<i class="fas fa-star"></i>'.repeat(Math.floor(p.rating || 5))}
          <span class="rating-count">(${p.reviewsCount || 12})</span>
        </div>
        ${p.hasVariations ? `<div class="options-count-tag"><i class="fas fa-sliders"></i> ${p.variations.length} Options Available</div>` : ''}
        <div class="product-bottom">
          <div class="product-price">
            <span class="price-current">${getProductPriceDisplay(p)}</span>
            <span class="price-vat-label">ex. VAT</span>
          </div>
          ${p.hasVariations ? `
            <a href="product-detail.html?id=${p.id}" class="select-options-btn">
              <span>Options</span> <i class="fas fa-arrow-right" style="font-size: 0.75rem;"></i>
            </a>
          ` : `
            <button class="add-cart-btn" onclick="cartManager.addItem('${p.id}')" title="Add to Basket">
              <i class="fas fa-shopping-bag"></i>
            </button>
          `}
        </div>
      </div>
    </div>
  `).join('');
}

/* Product Filter Tabs */
function initTabsNav() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetTab = tab.getAttribute('data-tab');
      renderProductsGrid(targetTab);
    });
  });
}

/* Mobile Menu Toggle */
function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileNavDrawer');
  const backdrop = document.getElementById('mobileNavBackdrop');
  const closeBtn = document.getElementById('closeMobileNavBtn');

  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.add('active');
      if (backdrop) backdrop.classList.add('active');
    });
  }

  if (closeBtn && menu) {
    closeBtn.addEventListener('click', () => {
      menu.classList.remove('active');
      if (backdrop) backdrop.classList.remove('active');
    });
  }

  if (backdrop && menu) {
    backdrop.addEventListener('click', () => {
      menu.classList.remove('active');
      backdrop.classList.remove('active');
    });
  }
}

/* Live Header Search */
function initLiveSearch() {
  const searchInput = document.getElementById('headerSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length > 2 && typeof PRODUCTS_DATA !== 'undefined') {
      const matches = PRODUCTS_DATA.filter(p => p.name.toLowerCase().includes(query));
      console.log('Search matches:', matches.length);
    }
  });
}

/* Scroll To Top */
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
