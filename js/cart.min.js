/**
 * shrinkwraps.co.uk - Cart & LocalStorage Manager with Multi-Variation Support
 */

class CartManager {
  constructor() {
    this.cartKey = 'shrinkwraps_cart';
    this.cart = this.loadCart();
    this.initListeners();
    this.updateUI();
  }

  loadCart() {
    try {
      const saved = localStorage.getItem(this.cartKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load cart', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(this.cartKey, JSON.stringify(this.cart));
      this.updateUI();
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  }

  /**
   * Adds a product or specific variation to cart
   * @param {string} productId - Product ID (e.g. 'p-1')
   * @param {number} qty - Quantity
   * @param {string|null} variationId - Specific variation ID (e.g. 'p-1-v2')
   */
  addItem(productId, qty = 1, variationId = null) {
    if (typeof PRODUCTS_DATA === 'undefined') return;
    const product = PRODUCTS_DATA.find(p => p.id === productId);
    if (!product) return;

    let cartItemId = product.id;
    let itemName = product.name;
    let itemPrice = product.price;
    let itemImage = product.image;
    let itemSku = product.sku;
    let variationText = '';
    let selectedAttrs = null;

    if (product.hasVariations && product.variations && product.variations.length > 0) {
      let selectedVar = null;
      if (variationId) {
        selectedVar = product.variations.find(v => v.id === variationId);
      }
      if (!selectedVar) {
        selectedVar = product.variations[0];
      }

      if (selectedVar) {
        cartItemId = `${product.id}__${selectedVar.id}`;
        itemPrice = selectedVar.price;
        itemSku = selectedVar.sku;
        itemImage = selectedVar.image || product.image;
        selectedAttrs = selectedVar.attributes;
        variationText = Object.entries(selectedVar.attributes)
          .map(([k, v]) => `${v}`)
          .join(' / ');
      }
    }

    const existingIndex = this.cart.findIndex(item => item.id === cartItemId);
    if (existingIndex > -1) {
      this.cart[existingIndex].qty += qty;
    } else {
      this.cart.push({
        id: cartItemId,
        productId: product.id,
        variationId: variationId,
        name: itemName,
        variationText: variationText,
        attributes: selectedAttrs,
        price: itemPrice,
        image: itemImage,
        sku: itemSku,
        qty: qty
      });
    }

    this.saveCart();
    const displayTitle = variationText ? `${product.name} (${variationText})` : product.name;
    this.showToast(`Added "${displayTitle.substring(0, 32)}..." to your basket!`);
    this.openDrawer();
  }

  addCustomItem(item) {
    const existingIndex = this.cart.findIndex(i => i.name === item.name);
    if (existingIndex > -1) {
      this.cart[existingIndex].qty += (item.quantity || 1);
    } else {
      this.cart.push({
        id: item.id || ('item-' + Date.now()),
        productId: item.productId || item.id,
        variationId: item.variationId || null,
        name: item.name,
        variationText: item.variationText || '',
        price: item.price,
        image: item.image,
        sku: item.sku || 'SW-GEN',
        qty: item.quantity || 1
      });
    }
    this.saveCart();
    this.showToast(`Added "${item.name.substring(0, 30)}..." to your basket!`);
    this.openDrawer();
  }

  removeItem(cartItemId) {
    this.cart = this.cart.filter(item => item.id !== cartItemId);
    this.saveCart();
    this.showToast('Item removed from basket');
  }

  updateQuantity(cartItemId, newQty) {
    if (newQty <= 0) {
      this.removeItem(cartItemId);
      return;
    }

    const item = this.cart.find(i => i.id === cartItemId);
    if (item) {
      item.qty = newQty;
      this.saveCart();
    }
  }

  getTotalCount() {
    return this.cart.reduce((total, item) => total + item.qty, 0);
  }

  getSubtotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.qty), 0);
  }

  updateUI() {
    // Update Badge Counts
    const badges = document.querySelectorAll('.cart-count-badge, #headerCartCount, .cart-badge');
    const totalCount = this.getTotalCount();
    badges.forEach(b => {
      b.textContent = totalCount;
    });

    const totalAmounts = document.querySelectorAll('#headerCartTotal');
    totalAmounts.forEach(el => {
      el.textContent = `£${this.getSubtotal().toFixed(2)}`;
    });

    // Update Slide-Over Drawer
    const drawerBody = document.getElementById('drawerCartItems');
    const drawerSubtotal = document.getElementById('drawerSubtotalAmount') || document.getElementById('drawerSubtotal');

    if (drawerSubtotal) {
      drawerSubtotal.textContent = `£${this.getSubtotal().toFixed(2)}`;
    }

    if (drawerBody) {
      if (this.cart.length === 0) {
        drawerBody.innerHTML = `
          <div style="text-align: center; padding: 3.5rem 1.5rem; color: #94a3b8;">
            <i class="fas fa-shopping-basket" style="font-size: 3.25rem; margin-bottom: 1.25rem; display: block; color: #cbd5e1;"></i>
            <p style="font-weight: 700; font-size: 1.1rem; color: #1e2832; margin-bottom: 0.5rem;">Your basket is empty</p>
            <p style="font-size: 0.9rem; margin-bottom: 1.5rem;">Browse our packaging supplies to find what you need.</p>
            <a href="shop.html" class="btn btn-primary btn-sm" style="padding: 0.6rem 1.25rem;">Start Shopping</a>
          </div>
        `;
      } else {
        drawerBody.innerHTML = this.cart.map(item => `
          <div class="drawer-cart-item">
            <img src="${item.image}" alt="${item.name}" class="drawer-item-img">
            <div class="drawer-item-info">
              <div class="drawer-item-title">${item.name}</div>
              ${item.variationText ? `<span class="drawer-item-variation"><i class="fas fa-layer-group" style="font-size: 0.7rem; margin-right: 3px;"></i> ${item.variationText}</span>` : ''}
              <div class="drawer-item-price">£${item.price.toFixed(2)} <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 400;">(ex. VAT)</span></div>
              <div class="drawer-item-qty">
                <button class="qty-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.qty - 1})">-</button>
                <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.qty}</span>
                <button class="qty-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.qty + 1})">+</button>
                <button onclick="cartManager.removeItem('${item.id}')" style="margin-left: auto; background: none; border: none; color: #ef4444; font-size: 0.85rem; cursor: pointer;" title="Remove">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  openDrawer() {
    const backdrop = document.getElementById('cartDrawerBackdrop') || document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (backdrop && drawer) {
      backdrop.classList.add('active');
      drawer.classList.add('active');
    }
  }

  closeDrawer() {
    const backdrop = document.getElementById('cartDrawerBackdrop') || document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');
    if (backdrop && drawer) {
      backdrop.classList.remove('active');
      drawer.classList.remove('active');
    }
  }

  initListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('#openCartDrawerBtn') || e.target.closest('.cart-trigger')) {
        const drawer = document.getElementById('cartDrawer');
        if (drawer) {
          e.preventDefault();
          this.openDrawer();
          return;
        }
      }
      if (e.target.closest('#closeCartDrawerBtn') || e.target.closest('#closeDrawerBtn') || e.target.id === 'cartDrawerBackdrop' || e.target.id === 'cartOverlay') {
        this.closeDrawer();
      }
    });
  }

  showToast(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle" style="color: #79a939; font-size: 1.1rem;"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Global singleton instance
let cartManager;
function initCartManager() {
  if (!cartManager) {
    cartManager = new CartManager();
  }
  return cartManager;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCartManager);
} else {
  initCartManager();
}
