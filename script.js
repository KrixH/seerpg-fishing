console.log(
    "%c Hatalmas köszönet a SeeRPG csapatának és a SeeRPG Tools fejlesztőjének! \n\n" +
    "%c- SeeRPG Hivatalos Oldal: %chttps://see-rpg.com/\n" +
    "%c- SeeRPG Tools Oldal:    %chttps://seerpgtools.com/",
    "color: #facc15; font-size: 16px; font-weight: bold; background: #18181b; padding: 8px 12px; border-radius: 6px;",
    "color: #9ca3af; font-size: 13px;", "color: #60a5fa; font-size: 13px; text-decoration: underline;",
    "color: #9ca3af; font-size: 13px;", "color: #60a5fa; font-size: 13px; text-decoration: underline;"
);

let changeLogData = [];

async function loadChangelog() {
    try {
        const response = await fetch('data/changelog.json');
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                changeLogData = data;
                console.log("Changelog sikeresen feldolgozva!", changeLogData);
            }
        }
    } catch (error) {
        console.error("JSON Syntax Hiba a changelog.json-ban vagy elérési hiba:", error);
    }
}

loadChangelog();

const updateBtn = document.getElementById('update-btn');
const updateModal = document.getElementById('update-modal');
const closeModalBtn = document.getElementById('close-modal');
const changelogContainer = document.getElementById('changelog-container');

function renderChangelog() {
    if(!changelogContainer) return;
    changelogContainer.innerHTML = '';
    changeLogData.forEach(log => {
        const card = document.createElement('div');
        card.className = 'update-card';
        
        let listHTML = '';
        log.changes.forEach(change => {
            listHTML += `<li>${change}</li>`;
        });

        card.innerHTML = `
            <div class="update-header">
                <span class="update-version">${log.version}</span>
                <span class="update-date">${log.date}</span>
            </div>
            <ul>
                ${listHTML}
            </ul>
        `;
        changelogContainer.appendChild(card);
    });
}

if(updateBtn) {
    updateBtn.addEventListener('click', () => {
        renderChangelog();
        updateModal.classList.add('active');
    });
}

if(closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        updateModal.classList.remove('active');
    });
}

if(updateModal) {
    updateModal.addEventListener('click', (e) => {
        if (e.target === updateModal) {
            updateModal.classList.remove('active');
        }
    });
}

const logUpload = document.getElementById('log-upload');
const fileListDiv = document.getElementById('file-list');
const statusIcon = document.getElementById('status-icon');
const totalMoneyEl = document.getElementById('total-money');
const totalSoldEl = document.getElementById('total-sold');
const totalCaughtEl = document.getElementById('total-caught');
const avgPriceEl = document.getElementById('avg-price');
const fishCategoriesEl = document.getElementById('fish-categories');

let currentTotalMoney = 0;
let currentFishCount = 0;
let currentCaughtCount = 0;

if(logUpload) {
    logUpload.addEventListener('change', async (e) => {
        const files = e.target.files;
        
        if (files.length === 0) {
            statusIcon.className = 'bx bx-x-circle status-icon text-red';
            fileListDiv.innerHTML = 'Nincs fájl betöltve';
            return;
        }

        statusIcon.className = 'bx bx-check-circle status-icon text-green';
        fileListDiv.innerHTML = `<span style="color: #f3f4f6">${files.length} fájl betöltve</span> - Fájlok feldolgozása...`;
        
        let allText = '';
        let totalSize = 0;

        for (let file of files) {
            totalSize += file.size;
            const text = await file.text();
            allText += text + '\n';
        }

        const kbSize = (totalSize / 1024).toFixed(0);
        fileListDiv.innerHTML = `<span style="color: #f3f4f6">${files.length} fájl betöltve</span> - ~${kbSize} KB`;

        processLogs(allText);
    });
}

function processLogs(text) {
    const sellRegex = /\[.*?\] \[CHAT\] Eladtál egy halat\.\s+Hal:\s+(.*?)\s+Súly:\s+(.*?) kg\s+Méret:\s+(.*?) cm\s+Ár:\s+([\d\s]+) Ft/g;
    const catchRegex = /\[.*?\] \[CHAT\] A kifogott halat megtalálod az inventorydban\./g;
    
    let match;
    let newTotalMoney = 0;
    let newFishCount = 0;
    let newCaughtCount = 0;
    const fishDataLogs = {};

    while ((match = sellRegex.exec(text)) !== null) {
        const fishName = match[1].trim();
        const weight = match[2].trim();
        const size = match[3].trim();
        const priceStr = match[4].replace(/\s/g, ''); 
        const price = parseInt(priceStr, 10);

        newTotalMoney += price;
        newFishCount++;

        if (!fishDataLogs[fishName]) {
            fishDataLogs[fishName] = [];
        }
        fishDataLogs[fishName].push({ weight, size, price });
    }

    while ((match = catchRegex.exec(text)) !== null) {
        newCaughtCount++;
    }

    fishCategoriesEl.innerHTML = '';

    if (newFishCount === 0) {
        fishCategoriesEl.classList.remove('loaded');
        fishCategoriesEl.innerHTML = '<div class="empty-state">Nem található hal eladás a kiválasztott fájlokban.</div>';
        avgPriceEl.innerHTML = '0';
    } else {
        fishCategoriesEl.classList.add('loaded');

        for (const [name, fishes] of Object.entries(fishDataLogs)) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'category-group';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'category-header';
            headerDiv.innerHTML = `
                <span>${name}</span>
                <span class="badge">${fishes.length} db</span>
            `;
            
            const ul = document.createElement('ul');
            ul.className = 'category-items';
            
            fishes.forEach(f => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="fish-info">
                        <span class="fish-details"><i class='bx bx-water'></i> ${f.weight} kg &nbsp;|&nbsp; <i class='bx bx-ruler'></i> ${f.size} cm</span>
                    </div>
                    <span class="fish-price">${f.price.toLocaleString('hu-HU')} Ft</span>
                `;
                ul.appendChild(li);
            });
            
            groupDiv.appendChild(headerDiv);
            groupDiv.appendChild(ul);
            fishCategoriesEl.appendChild(groupDiv);
        }

        const avg = Math.floor(newTotalMoney / newFishCount);
        avgPriceEl.innerHTML = avg.toLocaleString('hu-HU');
    }

    animateValue(totalMoneyEl, currentTotalMoney, newTotalMoney, 2500, true);
    animateValue(totalSoldEl, currentFishCount, newFishCount, 2500, false);
    animateValue(totalCaughtEl, currentCaughtCount, newCaughtCount, 2500, false);
    
    currentTotalMoney = newTotalMoney;
    currentFishCount = newFishCount;
    currentCaughtCount = newCaughtCount;
}

function animateValue(obj, start, end, duration, isMoney) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        let currentVal = Math.floor(easeOut * (end - start) + start);
        
        if (isMoney) {
            obj.innerHTML = currentVal.toLocaleString('hu-HU');
            updateColor(obj, currentVal);
        } else {
            obj.innerHTML = currentVal;
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            if (isMoney) {
                obj.innerHTML = end.toLocaleString('hu-HU');
                updateColor(obj, end);
            } else {
                obj.innerHTML = end;
            }
        }
    };
    window.requestAnimationFrame(step);
}

function updateColor(el, amount) {
    el.classList.remove('text-red', 'text-orange', 'text-green');
    if (amount < 100000) {
        el.classList.add('text-red');
    } else if (amount < 1000000) {
        el.classList.add('text-orange');
    } else {
        el.classList.add('text-green');
    }
}

function copyLogPath(btn) {
    const textToCopy = "%programdata%\\SeeRPG\\logs";
    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = "<i class='bx bx-check'></i> Másolva!";
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    });
}

const calcContainer = document.getElementById('fish-calculator-container');
let fishCalculatorData = [];

async function loadFishData() {
    if (!calcContainer) return;

    try {
        const response = await fetch('data/fishdata.json');
        if (response.ok) {
            fishCalculatorData = await response.json();
        }
    } catch (error) {
        fishCalculatorData = [
            { weight: 0.1, name: "Tükörponty", price: 227, rarity: "Common" },
            { weight: 0.1, name: "Mahi-Mahi", price: 188, rarity: "Rare" },
            { weight: 0.1, name: "Kecsege", price: 730, rarity: "Epic" },
            { weight: 0.1, name: "Tokhal", price: 189, rarity: "Legendary" },
            { weight: 0.1, name: "Ázsiai ajakoshal", price: 527, rarity: "Exotic" },
        ];
    }

    const rarityOrder = {
        "Common": 1,
        "Rare": 2,
        "Epic": 3,
        "Legendary": 4,
        "Exotic": 5
    };

    fishCalculatorData.sort((a, b) => {
        if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
            return rarityOrder[a.rarity] - rarityOrder[b.rarity];
        }
        return a.name.localeCompare(b.name, 'hu');
    });

    renderCalculator();
}

function renderCalculator() {
    calcContainer.innerHTML = "";
    
    const fragment = document.createDocumentFragment();

    fishCalculatorData.forEach((fish, index) => {
        const row = document.createElement('div');
        row.className = 'fish-row';

        row.innerHTML = `
            <div class="fish-info">
                <span class="calc-fish-name">${fish.name}</span>
                <span class="fish-details rarity-${fish.rarity}">${fish.rarity}</span>
            </div>
            <div>
                <input type="number" data-index="${index}" placeholder="Súly (kg)" step="0.1" min="0.0">
            </div>
            <div class="calc-total-price" id="calc-total-${index}">0 Ft</div>
        `;
        fragment.appendChild(row);
    });

    calcContainer.appendChild(fragment);
}

if (calcContainer) {
    calcContainer.addEventListener('input', (e) => {
        if (e.target && e.target.tagName === 'INPUT') {
            const index = parseInt(e.target.getAttribute('data-index'), 10);
            if (!isNaN(index)) {
                updateCalcPrice(index, e.target);
            }
        }
    });
}

function updateCalcPrice(index, weightInput) {
    const fish = fishCalculatorData[index];
    const totalElement = document.getElementById(`calc-total-${index}`);

    const weight = parseFloat(weightInput.value);

    if (!weight || weight <= 0) {
        totalElement.textContent = "0 Ft";
        return;
    }

    const unitPriceKg = fish.price * 10;
    const weightStr = weightInput.value.toString();

    if (weightStr.includes('.') && weightStr.split('.')[1].length > 1) {
        const exactMax = Math.floor(weight * unitPriceKg);
        const exactMin = Math.floor(exactMax * 0.65);
        
        totalElement.innerHTML = `
            <span style="color: #e91710;">${exactMin.toLocaleString('hu-HU')} Ft</span> - 
            <span style="color: #4cd137;">${exactMax.toLocaleString('hu-HU')} Ft</span>
        `;
        return;
    }

    const minPossibleWeight = Math.max(0, weight - 0.0499);
    const maxPossibleWeight = weight + 0.0499;

    const absMinPrice = Math.floor(Math.floor(minPossibleWeight * unitPriceKg) * 0.65);
    const absMaxPrice = Math.floor(maxPossibleWeight * unitPriceKg);

    totalElement.innerHTML = `
        <div style="font-size: 0.8rem; color: #8b92a0; margin-bottom: 2px;">~${absMinPrice.toLocaleString('hu-HU')} Ft - tól</div>
        <div style="color: #4cd137;">~${absMaxPrice.toLocaleString('hu-HU')} Ft - ig</div>
    `;
}

loadFishData();

// ============================================
// ZÁLOGHÁZ LOGIKA
// ============================================
let zaciItems = [];
const quantities = {};
let currentSearch = '';
let currentFilter = 'all';

const zaciContainer = document.getElementById('zaci-items-container');

async function loadZaciData() {
    if (!zaciContainer) return;

    try {
        const res = await fetch('data/zacidata.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        zaciItems = await res.json();
        renderZaci();
    } catch (err) {
        console.error('zacidata.json betöltési hiba:', err);
        zaciContainer.innerHTML = `
            <div class="zaci-no-results">
                <i class='bx bx-error-circle'></i>
                <p>Nem sikerült betölteni az adatokat.<br><small>(data/zacidata.json)</small></p>
            </div>
        `;
    }
}

function renderZaci() {
    if (!zaciContainer) return;
    zaciContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();
    let visibleCount = 0;

    zaciItems.forEach((item, index) => {
        const matchSearch = !currentSearch || item.name.toLowerCase().includes(currentSearch);
        const matchFilter = currentFilter === 'all'
            || (currentFilter === 'sp' && item.sp > 0)
            || (currentFilter === 'ft' && item.sp === 0);

        if (!matchSearch || !matchFilter) return;

        visibleCount++;
        const qty = quantities[index] || 0;
        const row = document.createElement('div');
        row.className = 'zaci-row';

        const priceHTML = item.sp > 0
            ? `<span class="zaci-item-price sp-price">${item.sp.toLocaleString('hu-HU')} SP / db</span>`
            : `<span class="zaci-item-price">${item.minFt.toLocaleString('hu-HU')} Ft - ${item.maxFt.toLocaleString('hu-HU')} Ft / db</span>`;

        const rightHTML = qty === 0
            ? `<button type="button" class="zaci-add-btn" data-action="add" data-index="${index}" aria-label="${item.name} hozzáadása">
                   <i class='bx bx-plus'></i> Hozzáadás
               </button>`
            : `<div class="zaci-stepper" role="group" aria-label="${item.name} mennyisége">
                   <button type="button" class="zaci-step-btn" data-action="decrease" data-index="${index}" aria-label="Csökkentés">−</button>
                   <span class="zaci-step-val" aria-live="polite">${qty}</span>
                   <button type="button" class="zaci-step-btn" data-action="increase" data-index="${index}" aria-label="Növelés">+</button>
               </div>`;

        row.innerHTML = `
            <div class="zaci-left">
                <img src="assets/zacis/${item.img}" alt="" class="zaci-icon"
                     onerror="this.src='assets/logo.png'; this.style.opacity='0.2';">
                <div class="zaci-info">
                    <span class="zaci-item-name">${item.name}</span>
                    ${priceHTML}
                </div>
            </div>
            <div class="zaci-right">${rightHTML}</div>
        `;
        fragment.appendChild(row);
    });

    if (visibleCount === 0) {
        const noRes = document.createElement('div');
        noRes.className = 'zaci-no-results';
        noRes.innerHTML = `<i class='bx bx-search-alt'></i><p>Nincs találat</p>`;
        fragment.appendChild(noRes);
    }

    zaciContainer.appendChild(fragment);
    calculateTotals();
}

function changeQty(index, delta) {
    const current = quantities[index] || 0;
    const next = Math.max(0, current + delta);
    quantities[index] = next;
    renderZaci();
}

function resetAll() {
    Object.keys(quantities).forEach(k => delete quantities[k]);
    renderZaci();
    showToast('Kijelölések törölve');
}

function calculateTotals() {
    const ftEl = document.getElementById('zaci-ft-total');
    const spEl = document.getElementById('zaci-sp-total');

    if (!ftEl || !spEl) return;

    let totalFtCount = 0;
    let minFtSum = 0;
    let maxFtSum = 0;
    let totalSpCount = 0;
    let spSum = 0;

    zaciItems.forEach((item, index) => {
        const q = quantities[index] || 0;
        if (q > 0) {
            if (item.sp > 0) {
                totalSpCount += q;
                spSum += item.sp * q;
            } else {
                totalFtCount += q;
                minFtSum += item.minFt * q;
                maxFtSum += item.maxFt * q;
            }
        }
    });

    ftEl.textContent = `${totalFtCount} db, ${minFtSum.toLocaleString('hu-HU')} Ft - ${maxFtSum.toLocaleString('hu-HU')} Ft`;
    spEl.textContent = `${totalSpCount} db, ${spSum.toLocaleString('hu-HU')} SP`;
}

const zaciSearchInput = document.getElementById('zaci-search');
const zaciFilterChips = document.querySelectorAll('#zaci-filters .zaci-filter-chip');

if (zaciSearchInput) {
    let searchTimeout;
    zaciSearchInput.addEventListener('input', e => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearch = e.target.value.trim().toLowerCase();
            renderZaci();
        }, 120);
    });
}

if (zaciFilterChips) {
    zaciFilterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            zaciFilterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderZaci();
        });
    });
}

if (zaciContainer) {
    zaciContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const index = parseInt(btn.dataset.index, 10);
        if (isNaN(index)) return;

        if (btn.dataset.action === 'add' || btn.dataset.action === 'increase') {
            changeQty(index, 1);
        } else if (btn.dataset.action === 'decrease') {
            changeQty(index, -1);
        }
    });
}

const zaciResetBtn = document.getElementById('zaci-reset-btn');
if (zaciResetBtn) {
    zaciResetBtn.addEventListener('click', resetAll);
}

function showToast(msg) {
    const wrap = document.getElementById('zaci-toasts');
    if (!wrap) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.padding = '12px 18px';
    toast.style.background = 'var(--bg-elevated)';
    toast.style.border = '1px solid rgba(74, 222, 128, 0.4)';
    toast.style.borderRadius = 'var(--radius-md)';
    toast.style.color = 'var(--text-light)';
    toast.style.fontSize = '0.88rem';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = 'var(--shadow-lg)';
    toast.innerHTML = `<i class='bx bx-check-circle' style="color: var(--accent-green); font-size: 1.2rem;"></i><span>${msg}</span>`;
    wrap.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

loadZaciData();


// ============================================
// SHOP LOGIKA
// ============================================
let shopItems = [];
const shopQuantities = {};
let currentShopSearch = '';
let currentShopCategory = 'etelek';

const shopContainer = document.getElementById('shop-items-container');

async function loadShopData() {
    if (!shopContainer) return;

    try {
        const res = await fetch('data/shopdata.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        shopItems = await res.json();
        renderShop();
    } catch (err) {
        console.error('shopdata.json betöltési hiba:', err);
        shopContainer.innerHTML = `
            <div class="zaci-no-results">
                <i class='bx bx-error-circle'></i>
                <p>Nem sikerült betölteni a bolt adatait.<br><small>(data/shopdata.json)</small></p>
            </div>
        `;
    }
}

function renderShop() {
    if (!shopContainer) return;
    shopContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();
    let visibleCount = 0;

    shopItems.forEach((item, index) => {
        const matchSearch = !currentShopSearch || item.name.toLowerCase().includes(currentShopSearch);
        const matchCategory = currentShopCategory === 'all' || item.category === currentShopCategory;

        if (!matchSearch || !matchCategory) return;

        visibleCount++;
        const qty = shopQuantities[index] || 0;
        const row = document.createElement('div');
        row.className = 'zaci-row';

        const priceHTML = `<span class="zaci-item-price">${item.price.toLocaleString('hu-HU')} Ft</span>`;

        const rightHTML = qty === 0
            ? `<button type="button" class="zaci-add-btn" data-shop-action="add" data-index="${index}">
                   <i class='bx bx-cart-add'></i> Kosárba
               </button>`
            : `<div class="zaci-stepper">
                   <button type="button" class="zaci-step-btn" data-shop-action="decrease" data-index="${index}">−</button>
                   <span class="zaci-step-val">${qty}</span>
                   <button type="button" class="zaci-step-btn" data-shop-action="increase" data-index="${index}">+</button>
               </div>`;

        // Ellenőrizzük, hogy a megadott img teljes URL (http/https), vagy helyi fájlnév
        const imgSrc = item.img && (item.img.startsWith('http://') || item.img.startsWith('https://'))
            ? item.img
            : `assets/shop/${item.img || 'default.png'}`;

        row.innerHTML = `
            <div class="zaci-left">
                <img src="${imgSrc}" alt="" class="zaci-icon"
                     onerror="this.src='assets/logo.png'; this.style.opacity='0.2';">
                <div class="zaci-info">
                    <span class="zaci-item-name">${item.name}</span>
                    ${priceHTML}
                </div>
            </div>
            <div class="zaci-right">${rightHTML}</div>
        `;
        fragment.appendChild(row);
    });

    if (visibleCount === 0) {
        const noRes = document.createElement('div');
        noRes.className = 'zaci-no-results';
        noRes.innerHTML = `<i class='bx bx-search-alt'></i><p>Nincs találat ebben a kategóriában</p>`;
        fragment.appendChild(noRes);
    }

    shopContainer.appendChild(fragment);
    calculateShopTotals();
}

function changeShopQty(index, delta) {
    const current = shopQuantities[index] || 0;
    const next = Math.max(0, current + delta);
    shopQuantities[index] = next;
    renderShop();
}

function calculateShopTotals() {
    const totalLine = document.getElementById('shop-total-line');
    const countLine = document.getElementById('shop-count-line');

    if (!totalLine || !countLine) return;

    let totalSum = 0;
    let totalCount = 0;

    shopItems.forEach((item, index) => {
        const q = shopQuantities[index] || 0;
        if (q > 0) {
            totalCount += q;
            totalSum += item.price * q;
        }
    });

    totalLine.textContent = `${totalSum.toLocaleString('hu-HU')} Ft értékű termék kiválasztva`;
    countLine.textContent = `${totalCount} db elem a kosárban`;
}

// Eseménykezelők
const shopSearchInput = document.getElementById('shop-search');
const shopCatBtns = document.querySelectorAll('#shop-categories .shop-cat-btn');

if (shopSearchInput) {
    shopSearchInput.addEventListener('input', e => {
        currentShopSearch = e.target.value.trim().toLowerCase();
        renderShop();
    });
}

if (shopCatBtns) {
    shopCatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shopCatBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentShopCategory = btn.dataset.cat;
            renderShop();
        });
    });
}

if (shopContainer) {
    shopContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-shop-action]');
        if (!btn) return;

        const index = parseInt(btn.dataset.index, 10);
        if (isNaN(index)) return;

        if (btn.dataset.shopAction === 'add' || btn.dataset.shopAction === 'increase') {
            changeShopQty(index, 1);
        } else if (btn.dataset.shopAction === 'decrease') {
            changeShopQty(index, -1);
        }
    });
}

const shopResetBtn = document.getElementById('shop-reset-btn');
if (shopResetBtn) {
    shopResetBtn.addEventListener('click', () => {
        Object.keys(shopQuantities).forEach(k => delete shopQuantities[k]);
        renderShop();
    });
}

loadShopData();