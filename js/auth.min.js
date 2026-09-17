/**
 * shrinkwraps.co.uk - Unified Authentication & Account Management
 * Handles Customer, B2B Trade Accounts, and Store Admin roles with persistent session
 */

class AuthManager {
  constructor() {
    this.sessionKey = 'shrinkwraps_session_user';
    this.usersKey = 'shrinkwraps_users_db';
    this.ordersKey = 'shrinkwraps_orders_db';
    this.tradeAppsKey = 'shrinkwraps_trade_apps_db';

    this.initDatabase();
    this.currentUser = this.loadSession();

    this.injectGlobalStyles();
    document.addEventListener('DOMContentLoaded', () => {
      this.injectGlobalStyles();
      this.injectSlideoverModal();
      this.updateHeaderUI();
      this.bindTriggers();
    });
  }

  injectGlobalStyles() {
    if (document.getElementById('authInjectedGlobalStyles')) return;
    const style = document.createElement('style');
    style.id = 'authInjectedGlobalStyles';
    style.innerHTML = `
      .user-header-profile-dropdown { position: relative !important; display: inline-flex !important; align-items: center !important; }
      .user-logged-badge {
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        background: rgba(255, 255, 255, 0.18) !important;
        color: #ffffff !important;
        border: 1px solid rgba(255, 255, 255, 0.35) !important;
        padding: 6px 14px !important;
        border-radius: 9999px !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        font-family: inherit !important;
        text-decoration: none !important;
        line-height: 1.2 !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15) !important;
      }
      .user-logged-badge:hover {
        background: rgba(255, 255, 255, 0.28) !important;
        border-color: #ffffff !important;
      }
      .user-role-pill {
        font-size: 10px !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
        padding: 2px 8px !important;
        border-radius: 999px !important;
        letter-spacing: 0.4px !important;
      }
      .user-role-pill.trade { background: #fbbf24 !important; color: #78350f !important; }
      .user-role-pill.admin { background: #ef4444 !important; color: #ffffff !important; }
      .user-role-pill.customer { background: #10b981 !important; color: #ffffff !important; }

      .user-dropdown-menu {
        position: absolute !important;
        top: calc(100% + 10px) !important;
        right: 0 !important;
        width: 260px !important;
        background: #ffffff !important;
        border-radius: 12px !important;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08) !important;
        padding: 12px !important;
        display: none !important;
        z-index: 99999 !important;
        text-align: left !important;
      }
      .user-dropdown-menu.active {
        display: block !important;
      }
      .dropdown-user-info { display: flex !important; flex-direction: column !important; gap: 2px !important; padding: 4px 6px 8px !important; color: #0f172a !important; }
      .dropdown-user-info strong { font-size: 13.5px !important; color: #0f172a !important; }
      .dropdown-user-info small { color: #64748b !important; font-size: 11.5px !important; }
      .trade-tier-tag { display: inline-flex !important; align-items: center !important; gap: 4px !important; margin-top: 6px !important; background: #fef3c7 !important; color: #92400e !important; font-size: 11px !important; font-weight: 700 !important; padding: 3px 8px !important; border-radius: 6px !important; }
      .dropdown-divider { height: 1px !important; background: #f1f5f9 !important; margin: 6px 0 !important; }
      .dropdown-item {
        display: flex !important; align-items: center !important; gap: 10px !important;
        width: 100% !important; padding: 9px 12px !important; font-size: 13px !important;
        font-weight: 600 !important; color: #334155 !important; border-radius: 8px !important;
        text-decoration: none !important; background: none !important; border: none !important;
        text-align: left !important; cursor: pointer !important; box-sizing: border-box !important;
      }
      .dropdown-item:hover { background: #f1f5f9 !important; color: #0f3e2e !important; }
      .dropdown-item.logout-btn { color: #dc2626 !important; }
      .dropdown-item.logout-btn:hover { background: #fef2f2 !important; color: #b91c1c !important; }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }

  /* -------------------------------------------------------------
   * DATABASE & SEED DATA INITIALIZATION
   * ----------------------------------------------------------- */
  initDatabase() {
    // Seed users if not existing
    if (!localStorage.getItem(this.usersKey)) {
      const defaultUsers = [
        {
          id: 'usr_trade_01',
          email: 'trade@shrinkwraps.co.uk',
          password: 'trade123',
          role: 'trade',
          name: 'David Miller',
          company: 'Apex Logistics & Freight Ltd',
          vatNumber: 'GB928371829',
          companyReg: '09876543',
          phone: '+44 7700 900123',
          tradeTier: 'Trade Gold (15% Wholesale Discount)',
          discountRate: 0.15,
          creditLimit: '£15,000 (30-Day Invoicing)',
          address: {
            line1: 'Unit 4, Heathrow Trade Park',
            city: 'Hounslow, London',
            postcode: 'TW6 2AB',
            country: 'United Kingdom'
          },
          createdAt: '2025-11-10'
        },
        {
          id: 'usr_cust_02',
          email: 'customer@shrinkwraps.co.uk',
          password: 'customer123',
          role: 'customer',
          name: 'Sarah Jenkins',
          company: 'Jenkins Artisan Crafts',
          phone: '+44 7700 900456',
          tradeTier: 'Verified Retail Buyer',
          discountRate: 0.0,
          creditLimit: 'Pay As You Go',
          address: {
            line1: '14 Meadow Close',
            city: 'Manchester',
            postcode: 'M14 6XX',
            country: 'United Kingdom'
          },
          createdAt: '2026-01-15'
        },
        {
          id: 'usr_admin_00',
          email: 'admin@shrinkwraps.co.uk',
          password: 'admin123',
          role: 'admin',
          name: 'Store Administrator',
          company: 'shrinkwraps.co.uk HQ',
          phone: '+44 020 8123 4567',
          tradeTier: 'Administrator Full Access',
          discountRate: 0.0,
          creditLimit: 'N/A',
          createdAt: '2025-01-01'
        }
      ];
      localStorage.setItem(this.usersKey, JSON.stringify(defaultUsers));
    }

    // Seed mock orders if not existing
    if (!localStorage.getItem(this.ordersKey)) {
      const defaultOrders = [
        {
          id: 'SW-89421',
          userId: 'usr_trade_01',
          userEmail: 'trade@shrinkwraps.co.uk',
          company: 'Apex Logistics & Freight Ltd',
          date: '2026-09-15',
          total: 648.50,
          status: 'Dispatched',
          trackingNumber: 'DPD-UK-889210492',
          items: [
            { name: 'Extended Core Pallet Stretch Wrap 400mm x 300m (Clear - 17mu)', qty: 48, price: 5.95 },
            { name: 'Heavy Duty 48mm x 66m Vibac Brown Packing Tape (Box of 36)', qty: 4, price: 34.50 },
            { name: 'Pallet Top Covers 500 Gauge Perforated Roll', qty: 2, price: 42.00 }
          ]
        },
        {
          id: 'SW-89210',
          userId: 'usr_trade_01',
          userEmail: 'trade@shrinkwraps.co.uk',
          company: 'Apex Logistics & Freight Ltd',
          date: '2026-08-28',
          total: 1120.00,
          status: 'Delivered',
          trackingNumber: 'DPD-UK-772910411',
          items: [
            { name: 'Heavy Duty Black Pallet Wrap 500mm x 250m (23mu)', qty: 80, price: 7.20 },
            { name: 'Machine Stretch Film 500mm x 16kg Flush Core', qty: 6, price: 72.00 }
          ]
        },
        {
          id: 'SW-89504',
          userId: 'usr_cust_02',
          userEmail: 'customer@shrinkwraps.co.uk',
          company: 'Jenkins Artisan Crafts',
          date: '2026-09-12',
          total: 86.40,
          status: 'Processing',
          trackingNumber: 'RM-48-99210381',
          items: [
            { name: 'Grey Mailing Bags Strong Poly Post Bags (10x14" - Pack of 100)', qty: 2, price: 12.50 },
            { name: 'Royal Mail Small Parcel PIP Cardboard Postal Boxes (Pack of 50)', qty: 1, price: 28.50 },
            { name: 'Fragile Printed Warning Packing Tape (Pack of 6)', qty: 1, price: 14.20 }
          ]
        },
        {
          id: 'SW-89612',
          userId: 'usr_cust_guest',
          userEmail: 'metro.fast@outlook.com',
          company: 'Metro Fast Deliveries',
          date: '2026-09-17',
          total: 312.80,
          status: 'Pending',
          trackingNumber: 'Pending Fulfillment',
          items: [
            { name: 'Clear Hand Stretch Pallet Wrap Standard Core (6 Rolls)', qty: 10, price: 24.50 },
            { name: 'Heavy Duty Black Refuse Sacks 200 Gauge (Box of 200)', qty: 2, price: 33.90 }
          ]
        }
      ];
      localStorage.setItem(this.ordersKey, JSON.stringify(defaultOrders));
    }

    // Seed Trade Applications
    if (!localStorage.getItem(this.tradeAppsKey)) {
      const defaultApps = [
        {
          id: 'APP-1049',
          company: 'Northwest Distribution Hub',
          contactName: 'James Henderson',
          email: 'j.henderson@nwdistrib.co.uk',
          vatNumber: 'GB445812903',
          monthlySpend: '£2,500 - £5,000',
          status: 'Pending Review',
          submittedAt: '2026-09-16'
        },
        {
          id: 'APP-1048',
          company: 'E-Commerce Fulfilment Pros UK',
          contactName: 'Gemma Davies',
          email: 'gemma@ecfulfilment.co.uk',
          vatNumber: 'GB778102941',
          monthlySpend: '£5,000+',
          status: 'Approved',
          submittedAt: '2026-09-14'
        }
      ];
      localStorage.setItem(this.tradeAppsKey, JSON.stringify(defaultApps));
    }
  }

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.usersKey)) || [];
    } catch (e) {
      return [];
    }
  }

  getOrders() {
    try {
      return JSON.parse(localStorage.getItem(this.ordersKey)) || [];
    } catch (e) {
      return [];
    }
  }

  getTradeApps() {
    try {
      return JSON.parse(localStorage.getItem(this.tradeAppsKey)) || [];
    } catch (e) {
      return [];
    }
  }

  saveOrders(orders) {
    localStorage.setItem(this.ordersKey, JSON.stringify(orders));
  }

  saveTradeApps(apps) {
    localStorage.setItem(this.tradeAppsKey, JSON.stringify(apps));
  }

  /* -------------------------------------------------------------
   * SESSION STATE MANAGEMENT
   * ----------------------------------------------------------- */
  loadSession() {
    try {
      const data = localStorage.getItem(this.sessionKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveSession(user) {
    this.currentUser = user;
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
    this.updateHeaderUI();
    if (typeof cartManager !== 'undefined' && cartManager.updateUI) {
      cartManager.updateUI();
    }
  }

  logout() {
    localStorage.removeItem(this.sessionKey);
    this.currentUser = null;
    this.showToast('You have been logged out successfully.');
    this.updateHeaderUI();
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('account.html')) {
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 400);
    }
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  getUser() {
    return this.currentUser;
  }

  /* -------------------------------------------------------------
   * AUTHENTICATION ACTIONS
   * ----------------------------------------------------------- */
  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
    
    if (user) {
      this.saveSession(user);
      this.closeSlideover();
      this.showToast(`Welcome back, ${user.name || user.company}!`);
      
      if (typeof renderAccountPage === 'function') {
        renderAccountPage();
      }
      return { success: true, user };
    } else {
      return { success: false, error: 'Invalid email address or password.' };
    }
  }

  loginAsDemo(role = 'trade') {
    const users = this.getUsers();
    let user;
    if (role === 'trade') {
      user = users.find(u => u.role === 'trade');
    } else if (role === 'admin') {
      user = users.find(u => u.role === 'admin');
    } else {
      user = users.find(u => u.role === 'customer');
    }

    if (user) {
      this.saveSession(user);
      this.closeSlideover();
      this.showToast(`Logged in as ${user.name} (${user.role.toUpperCase()})`);
      if (typeof renderAccountPage === 'function') {
        renderAccountPage();
      } else if (window.location.pathname.includes('login.html')) {
        location.reload();
      }
      return { success: true, user };
    }
  }

  register(data) {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === data.email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser = {
      id: 'usr_' + Date.now().toString(36),
      email: data.email.trim(),
      password: data.password,
      role: data.role || (data.vatNumber ? 'trade' : 'customer'),
      name: data.name || data.company,
      company: data.company || '',
      vatNumber: data.vatNumber || '',
      companyReg: data.companyReg || '',
      phone: data.phone || '',
      tradeTier: data.vatNumber ? 'Trade Standard (10% Tier)' : 'Standard Customer',
      discountRate: data.vatNumber ? 0.10 : 0.0,
      creditLimit: data.vatNumber ? '£2,500 (Trade Terms Under Review)' : 'Pay As You Go',
      address: {
        line1: data.addressLine1 || '',
        city: data.city || '',
        postcode: data.postcode || '',
        country: 'United Kingdom'
      },
      createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    localStorage.setItem(this.usersKey, JSON.stringify(users));

    if (newUser.role === 'trade') {
      const apps = this.getTradeApps();
      apps.unshift({
        id: 'APP-' + Math.floor(1000 + Math.random() * 9000),
        company: newUser.company,
        contactName: newUser.name,
        email: newUser.email,
        vatNumber: newUser.vatNumber,
        monthlySpend: '£1,000 - £2,500',
        status: 'Pending Verification',
        submittedAt: new Date().toISOString().split('T')[0]
      });
      this.saveTradeApps(apps);
    }

    this.saveSession(newUser);
    this.closeSlideover();
    this.showToast(`Account registered successfully! Welcome ${newUser.name}.`);
    
    if (typeof renderAccountPage === 'function') {
      renderAccountPage();
    }
    return { success: true, user: newUser };
  }

  /* -------------------------------------------------------------
   * ADMIN METHODS
   * ----------------------------------------------------------- */
  updateOrderStatus(orderId, newStatus) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      this.saveOrders(orders);
      this.showToast(`Order ${orderId} status updated to: ${newStatus}`);
      return true;
    }
    return false;
  }

  updateTradeAppStatus(appId, newStatus) {
    const apps = this.getTradeApps();
    const app = apps.find(a => a.id === appId);
    if (app) {
      app.status = newStatus;
      this.saveTradeApps(apps);
      this.showToast(`Application ${appId} marked as: ${newStatus}`);
      return true;
    }
    return false;
  }

  /* -------------------------------------------------------------
   * UI SYNCHRONIZATION & DYNAMIC HEADER
   * ----------------------------------------------------------- */
  updateHeaderUI() {
    const authLinks = document.querySelectorAll('.nav-right-actions a:first-child, #headerAuthBtn');
    if (!authLinks || authLinks.length === 0) return;

    authLinks.forEach(authLink => {
      if (this.currentUser) {
        const isTrade = this.currentUser.role === 'trade';
        const isAdmin = this.currentUser.role === 'admin';
        
        const badgeIcon = isAdmin ? 'fa-shield-halved' : (isTrade ? 'fa-building' : 'fa-user-check');
        const badgeText = isAdmin ? 'Admin Panel' : (isTrade ? 'Trade Gold' : 'My Account');
        const displayName = this.currentUser.name ? this.currentUser.name.split(' ')[0] : (this.currentUser.company || 'User');

        authLink.outerHTML = `
          <div class="user-header-profile-dropdown" style="position: relative; display: inline-block;">
            <button type="button" class="user-logged-badge" onclick="authManager.toggleHeaderDropdown(event)" aria-label="User Account Menu">
              <i class="fas ${badgeIcon}"></i>
              <span class="user-name-label">${displayName}</span>
              <span class="user-role-pill ${this.currentUser.role}">${badgeText}</span>
              <i class="fas fa-chevron-down" style="font-size: 10px; margin-left: 4px;"></i>
            </button>
            <div class="user-dropdown-menu" id="userHeaderDropdownMenu">
              <div class="dropdown-user-info">
                <strong>${this.currentUser.name || this.currentUser.company}</strong>
                <small>${this.currentUser.email}</small>
                ${isTrade ? `<div class="trade-tier-tag"><i class="fas fa-percent"></i> 15% Trade Wholesale Active</div>` : ''}
              </div>
              <div class="dropdown-divider"></div>
              <a href="login.html" class="dropdown-item"><i class="fas fa-th-large"></i> ${isAdmin ? 'Admin Management Hub' : 'Account & Orders'}</a>
              <a href="shop.html" class="dropdown-item"><i class="fas fa-boxes-stacked"></i> Browse Packaging Catalog</a>
              <button type="button" class="dropdown-item logout-btn" onclick="authManager.logout()"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
            </div>
          </div>
        `;
      } else {
        // Guest state
        if (authLink.classList && authLink.classList.contains('user-logged-badge')) {
          const parent = authLink.closest('.user-header-profile-dropdown');
          if (parent) {
            parent.outerHTML = `<a href="login.html" class="nav-action-link" id="headerAuthBtn" onclick="if(window.innerWidth > 768){ event.preventDefault(); authManager.openSlideover(); }"><i class="far fa-user"></i> LOGIN / REGISTER</a>`;
          }
        } else {
          authLink.innerHTML = `<i class="far fa-user"></i> LOGIN / REGISTER`;
          authLink.setAttribute('href', 'login.html');
          authLink.onclick = (e) => {
            if (!window.location.pathname.includes('login.html')) {
              e.preventDefault();
              this.openSlideover();
            }
          };
        }
      }
    });

    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('userHeaderDropdownMenu');
      if (dropdown && !e.target.closest('.user-header-profile-dropdown')) {
        dropdown.classList.remove('active');
      }
    });
  }

  toggleHeaderDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('userHeaderDropdownMenu');
    if (dropdown) {
      dropdown.classList.toggle('active');
    }
  }

  bindTriggers() {
    document.querySelectorAll('[data-auth-modal]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.openSlideover();
      });
    });
  }

  /* -------------------------------------------------------------
   * SLIDE-OVER QUICK AUTH MODAL INJECTION & LOGIC
   * ----------------------------------------------------------- */
  injectSlideoverModal() {
    if (document.getElementById('authSlideoverDrawer')) return;

    const modalHTML = `
      <!-- Backdrop -->
      <div class="auth-drawer-backdrop" id="authDrawerBackdrop" onclick="authManager.closeSlideover()"></div>

      <!-- Slide-Over Drawer -->
      <div class="auth-slideover-drawer" id="authSlideoverDrawer">
        <div class="auth-drawer-header">
          <div class="auth-drawer-brand">
            <i class="fas fa-shield-halved" style="color: #059669; font-size: 24px;"></i>
            <div>
              <h3>Account & Trade Portal</h3>
              <p>Trade discounts, order tracking & fast checkout</p>
            </div>
          </div>
          <button class="close-auth-drawer" onclick="authManager.closeSlideover()" aria-label="Close">&times;</button>
        </div>

        <!-- Quick 1-Click Demo Buttons -->
        <div class="auth-quick-demos">
          <div class="quick-demo-title"><i class="fas fa-bolt"></i> 1-Click Instant Demo Login:</div>
          <div class="quick-demo-grid">
            <button type="button" class="demo-btn demo-trade" onclick="authManager.loginAsDemo('trade')">
              <i class="fas fa-building"></i>
              <div>
                <strong>Trade Buyer</strong>
                <small>15% Wholesale Tier</small>
              </div>
            </button>
            <button type="button" class="demo-btn demo-cust" onclick="authManager.loginAsDemo('customer')">
              <i class="fas fa-user"></i>
              <div>
                <strong>Customer</strong>
                <small>Retail Buyer</small>
              </div>
            </button>
            <button type="button" class="demo-btn demo-admin" onclick="authManager.loginAsDemo('admin')">
              <i class="fas fa-user-shield"></i>
              <div>
                <strong>Store Admin</strong>
                <small>Management Hub</small>
              </div>
            </button>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="auth-tabs-nav">
          <button class="auth-tab-btn active" data-tab="loginTab" onclick="authManager.switchTab('loginTab')">
            <i class="fas fa-sign-in-alt"></i> Sign In
          </button>
          <button class="auth-tab-btn" data-tab="registerTab" onclick="authManager.switchTab('registerTab')">
            <i class="fas fa-building"></i> Trade Register
          </button>
          <button class="auth-tab-btn" data-tab="adminTab" onclick="authManager.switchTab('adminTab')">
            <i class="fas fa-lock"></i> Admin
          </button>
        </div>

        <div class="auth-drawer-body">
          <!-- 1. SIGN IN FORM -->
          <div class="auth-tab-pane active" id="loginTab">
            <form id="slideoverLoginForm" onsubmit="authManager.handleLoginForm(event)">
              <div class="auth-input-group">
                <label><i class="fas fa-envelope"></i> Email Address</label>
                <input type="email" id="modalLoginEmail" placeholder="e.g. trade@shrinkwraps.co.uk" required>
              </div>
              <div class="auth-input-group">
                <label><i class="fas fa-lock"></i> Password</label>
                <input type="password" id="modalLoginPassword" placeholder="Enter your password" required>
              </div>
              <div class="auth-form-options">
                <label class="remember-me">
                  <input type="checkbox" checked> <span>Remember this device</span>
                </label>
                <a href="javascript:void(0);" onclick="authManager.showForgotNotice()" class="forgot-pass-link">Forgot password?</a>
              </div>
              <div id="modalLoginError" class="auth-error-msg" style="display: none;"></div>
              <button type="submit" class="auth-submit-btn">
                <span>Sign In to Account</span> <i class="fas fa-arrow-right"></i>
              </button>
            </form>
            <div class="auth-panel-footer">
              <span>Looking for trade prices & credit terms?</span>
              <a href="javascript:void(0);" onclick="authManager.switchTab('registerTab')">Apply for Trade Account &rarr;</a>
            </div>
          </div>

          <!-- 2. TRADE REGISTER FORM -->
          <div class="auth-tab-pane" id="registerTab" style="display: none;">
            <div class="trade-perks-banner">
              <i class="fas fa-gem"></i>
              <div>
                <strong>Trade Benefits:</strong> Up to 30% bulk savings, 30-day invoice credit & priority next-day dispatch.
              </div>
            </div>
            <form id="slideoverRegisterForm" onsubmit="authManager.handleRegisterForm(event)">
              <div class="auth-input-group">
                <label><i class="fas fa-building"></i> Company / Business Name *</label>
                <input type="text" id="modalRegCompany" placeholder="e.g. Apex Logistics Ltd" required>
              </div>
              <div class="auth-input-row">
                <div class="auth-input-group">
                  <label><i class="fas fa-receipt"></i> UK VAT Number (Optional)</label>
                  <input type="text" id="modalRegVat" placeholder="e.g. GB982347102">
                </div>
                <div class="auth-input-group">
                  <label><i class="fas fa-phone"></i> Phone Number *</label>
                  <input type="tel" id="modalRegPhone" placeholder="e.g. 07700 900123" required>
                </div>
              </div>
              <div class="auth-input-group">
                <label><i class="fas fa-user"></i> Contact Name *</label>
                <input type="text" id="modalRegName" placeholder="e.g. David Miller" required>
              </div>
              <div class="auth-input-group">
                <label><i class="fas fa-envelope"></i> Work Email Address *</label>
                <input type="email" id="modalRegEmail" placeholder="e.g. accounts@yourcompany.co.uk" required>
              </div>
              <div class="auth-input-group">
                <label><i class="fas fa-lock"></i> Create Password *</label>
                <input type="password" id="modalRegPassword" placeholder="Minimum 6 characters" minlength="6" required>
              </div>
              <div id="modalRegError" class="auth-error-msg" style="display: none;"></div>
              <button type="submit" class="auth-submit-btn btn-trade-reg">
                <span>Create Trade Account</span> <i class="fas fa-check-circle"></i>
              </button>
            </form>
          </div>

          <!-- 3. ADMIN ACCESS FORM -->
          <div class="auth-tab-pane" id="adminTab" style="display: none;">
            <div class="admin-access-notice">
              <i class="fas fa-user-shield"></i>
              <p>Restricted access portal for authorized shrinkwraps.co.uk operations staff.</p>
            </div>
            <form id="slideoverAdminForm" onsubmit="authManager.handleAdminForm(event)">
              <div class="auth-input-group">
                <label><i class="fas fa-id-badge"></i> Admin Email</label>
                <input type="email" id="modalAdminEmail" value="admin@shrinkwraps.co.uk" required>
              </div>
              <div class="auth-input-group">
                <label><i class="fas fa-key"></i> Administrator Passcode</label>
                <input type="password" id="modalAdminPassword" placeholder="Enter administrator password" required>
              </div>
              <div id="modalAdminError" class="auth-error-msg" style="display: none;"></div>
              <button type="submit" class="auth-submit-btn btn-admin-auth">
                <i class="fas fa-shield-alt"></i> <span>Authenticate Admin</span>
              </button>
            </form>
            <div class="auth-quick-hint">
              <small>Demo admin credentials: <code>admin@shrinkwraps.co.uk</code> / <code>admin123</code></small>
            </div>
          </div>
        </div>

        <div class="auth-drawer-bottom-link">
          <a href="login.html" onclick="authManager.closeSlideover()"><i class="fas fa-external-link-alt"></i> Open Full Dedicated Account Portal</a>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.id = 'authDrawerContainer';
    wrapper.innerHTML = modalHTML;
    document.body.appendChild(wrapper);
  }

  openSlideover() {
    const drawer = document.getElementById('authSlideoverDrawer');
    const backdrop = document.getElementById('authDrawerBackdrop');
    if (drawer && backdrop) {
      drawer.classList.add('open');
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  closeSlideover() {
    const drawer = document.getElementById('authSlideoverDrawer');
    const backdrop = document.getElementById('authDrawerBackdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  switchTab(tabId) {
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.auth-tab-pane').forEach(pane => {
      if (pane.id === tabId) {
        pane.style.display = 'block';
        pane.classList.add('active');
      } else {
        pane.style.display = 'none';
        pane.classList.remove('active');
      }
    });
  }

  handleLoginForm(e) {
    e.preventDefault();
    const email = document.getElementById('modalLoginEmail').value;
    const pass = document.getElementById('modalLoginPassword').value;
    const errEl = document.getElementById('modalLoginError');

    const result = this.login(email, pass);
    if (!result.success) {
      errEl.textContent = result.error;
      errEl.style.display = 'block';
    } else {
      errEl.style.display = 'none';
    }
  }

  handleRegisterForm(e) {
    e.preventDefault();
    const data = {
      company: document.getElementById('modalRegCompany').value,
      vatNumber: document.getElementById('modalRegVat').value,
      phone: document.getElementById('modalRegPhone').value,
      name: document.getElementById('modalRegName').value,
      email: document.getElementById('modalRegEmail').value,
      password: document.getElementById('modalRegPassword').value,
      role: 'trade'
    };
    const errEl = document.getElementById('modalRegError');

    const result = this.register(data);
    if (!result.success) {
      errEl.textContent = result.error;
      errEl.style.display = 'block';
    } else {
      errEl.style.display = 'none';
    }
  }

  handleAdminForm(e) {
    e.preventDefault();
    const email = document.getElementById('modalAdminEmail').value;
    const pass = document.getElementById('modalAdminPassword').value;
    const errEl = document.getElementById('modalAdminError');

    const result = this.login(email, pass);
    if (!result.success) {
      errEl.textContent = result.error;
      errEl.style.display = 'block';
    } else {
      errEl.style.display = 'none';
    }
  }

  showForgotNotice() {
    alert('Password Reset:\n\nFor security, password reset links are sent via authorized email. Since this is a trade test environment, you can use the Instant Demo Login buttons at the top of the panel, or contact support@shrinkwraps.co.uk.');
  }

  showToast(message) {
    const existing = document.getElementById('authToastNotice');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'authToastNotice';
    toast.className = 'auth-toast-notification';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('visible');
    }, 50);

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }
}

// Global Singleton Instance
const authManager = new AuthManager();
