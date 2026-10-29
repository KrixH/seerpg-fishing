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
const totalFishEl = document.getElementById('total-fish');
const avgPriceEl = document.getElementById('avg-price');
const fishCategoriesEl = document.getElementById('fish-categories');

let currentTotalMoney = 0;
let currentFishCount = 0;

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
    const regex = /\[.*?\] \[CHAT\] Eladtál egy halat\.\s+Hal:\s+(.*?)\s+Súly:\s+(.*?) kg\s+Méret:\s+(.*?) cm\s+Ár:\s+([\d\s]+) Ft/g;
    let match;
    
    let newTotalMoney = 0;
    let newFishCount = 0;
    const fishDataLogs = {};

    while ((match = regex.exec(text)) !== null) {
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
    animateValue(totalFishEl, currentFishCount, newFishCount, 2500, false);
    
    currentTotalMoney = newTotalMoney;
    currentFishCount = newFishCount;
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

// Árkalkulátor logika

// --- TELJESÍTMÉNY-OPTIMALIZÁLT ÁRKALKULÁTOR ---

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
    
    // Egyszerre rendereljük be az összes sort (hatalmas teljesítménynövekedés)
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

// Event Delegation: EGYetlen eseményfigyelő az egész listára (megszünteti a laggolást!)
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