console.log(
    "%c Hatalmas köszönet a SeeRPG csapatának és a SeeRPG Tools fejlesztőjének! \n\n" +
    "%c- SeeRPG Hivatalos Oldal: %chttps://see-rpg.com/\n" +
    "%c- SeeRPG Tools Oldal:    %chttps://seerpgtools.com/",
    "color: #facc15; font-size: 16px; font-weight: bold; background: #18181b; padding: 8px 12px; border-radius: 6px;",
    "color: #9ca3af; font-size: 13px;", "color: #60a5fa; font-size: 13px; text-decoration: underline;",
    "color: #9ca3af; font-size: 13px;", "color: #60a5fa; font-size: 13px; text-decoration: underline;"
);

const logUpload = document.getElementById('log-upload');
const fileListDiv = document.getElementById('file-list');
const statusIcon = document.getElementById('status-icon'); // ÚJ: Ikon lekérése
const totalMoneyEl = document.getElementById('total-money');
const totalFishEl = document.getElementById('total-fish');
const avgPriceEl = document.getElementById('avg-price');
const fishCategoriesEl = document.getElementById('fish-categories');

let currentTotalMoney = 0;
let currentFishCount = 0;

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

function processLogs(text) {
    const regex = /\[.*?\] \[CHAT\] Eladtál egy halat\.\s+Hal:\s+(.*?)\s+Súly:\s+(.*?) kg\s+Méret:\s+(.*?) cm\s+Ár:\s+([\d\s]+) Ft/g;
    let match;
    
    let newTotalMoney = 0;
    let newFishCount = 0;
    
    const fishData = {};

    while ((match = regex.exec(text)) !== null) {
        const fishName = match[1].trim();
        const weight = match[2].trim();
        const size = match[3].trim();
        const priceStr = match[4].replace(/\s/g, ''); 
        const price = parseInt(priceStr, 10);

        newTotalMoney += price;
        newFishCount++;

        if (!fishData[fishName]) {
            fishData[fishName] = [];
        }
        fishData[fishName].push({ weight, size, price });
    }

    fishCategoriesEl.innerHTML = '';

    if (newFishCount === 0) {
        fishCategoriesEl.classList.remove('loaded');
        fishCategoriesEl.innerHTML = '<div class="empty-state">Nem található hal eladás a kiválasztott fájlokban.</div>';
        avgPriceEl.innerHTML = '0';
    } else {
        fishCategoriesEl.classList.add('loaded');

        for (const [name, fishes] of Object.entries(fishData)) {
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