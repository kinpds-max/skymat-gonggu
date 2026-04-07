// Hasnol Estimate App Logic

function safeCreateIcons() {
    try {
        if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
            safeCreateIcons();
        }
    } catch (e) {
        console.warn('lucide.createIcons 실패:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const customerNameIpt = document.getElementById('customerName');
    const customerPhoneIpt = document.getElementById('customerPhone');
    const customerEmailIpt = document.getElementById('customerEmail');
    const customerRegionIpt = document.getElementById('customerRegion');
    const customerAptIpt = document.getElementById('customerApt');
    const customerSizeIpt = document.getElementById('customerSize');
    const customerScopeIpt = document.getElementById('customerScope');
    const customerTendencySel = document.getElementById('customerTendency');

    const matSizeSel = document.getElementById('matSize');
    const matTypeSel = document.getElementById('matType');
    
    // New Multi-Space Elements
    const spacesContainer = document.getElementById('spacesContainer');
    const addSpaceBtn = document.getElementById('addSpaceBtn');

    const pricePerMatIpt = document.getElementById('pricePerMat');
    const discountPerMatIpt = document.getElementById('discountPerMat');
    const groupPurchaseTier = document.getElementById('groupPurchaseTier');
    const extraDiscountTier = document.getElementById('extraDiscountTier');
    const referralCountIpt = document.getElementById('referralCount');
    const regionDeliveryChk = document.getElementById('regionDelivery');
    const reinstallChk = document.getElementById('reinstallChk');

    const reviewCashChk = document.getElementById('reviewCash');
    const reviewEventChk = document.getElementById('reviewEvent');
    const calculateBtn = document.getElementById('calculateBtn');

    const resultSection = document.querySelector('.result-section');
    const comparisonSummaryTable = document.getElementById('comparisonSummaryTable');
    const estimateDateIpt = document.getElementById('estimateDate');

    if (estimateDateIpt) {
        const today = new Date().toISOString().slice(0, 10);
        estimateDateIpt.value = today;
    }
    const sketchPad = document.getElementById('sketchPad');

    const resQty = document.getElementById('resQty');
    const resTotal = document.getElementById('resTotal');

    const appliedUnitPriceBox = document.getElementById('appliedUnitPrice');
    const valAppliedPrice = document.getElementById('valAppliedPrice');

    const infoBasePrice = document.getElementById('infoBasePrice');
    const infoSpecialDiscount = document.getElementById('infoSpecialDiscount');
    const infoAddDiscount = document.getElementById('infoAddDiscount');
    const infoInstallFee = document.getElementById('infoInstallFee');
    const infoFinalPrice = document.getElementById('infoFinalPrice');

    const contractBuyer = document.getElementById('contractBuyerName');
    const contractBuyerPhone = document.getElementById('contractBuyerPhone');
    const contractBuyerLocation = document.getElementById('contractBuyerLocation');
    const contractBuyerSize = document.getElementById('contractBuyerSize');
    const contractBuyerScope = document.getElementById('contractBuyerScope');
    
    const contractTotal = document.getElementById('infoFinalPrice'); // Link to the same summary span for consistency

    // Pricing Data
    const pricingMatrix = {
        '600': { standard: [29000, 25000], leather: [33000, 29000] },
        '800': { standard: [80000, 47000], leather: [90000, 57000] },
        '1000': { standard: [130000, 95000], leather: [130000, 95000] },
        '1200': { leather: [200000, 150000] } // Leather only as requested
    };

    // Quick Preset Logic
    const homePresets = document.getElementById('homePresets');
    const residentialGrid = document.getElementById('residentialGrid');
    const commercialGrid = document.getElementById('commercialGrid');
    const facilityRadios = document.querySelectorAll('input[name="facilityType"]');
    const presetBtns = document.querySelectorAll('.preset-btn');
    let activePresetQty600 = null;

    facilityRadios.forEach(radio => {
        radio.parentElement.addEventListener('click', () => {
            facilityRadios.forEach(r => r.parentElement.classList.remove('active'));
            radio.parentElement.classList.add('active');
            radio.checked = true;
            
            if (radio.value === 'home') {
                residentialGrid.style.display = 'grid';
                commercialGrid.style.display = 'none';
            } else {
                residentialGrid.style.display = 'none';
                commercialGrid.style.display = 'grid';
            }
            activePresetQty600 = null;
            presetBtns.forEach(b => b.classList.remove('active'));
            calculateEstimate();
        });
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activePresetQty600 = parseInt(btn.dataset.qty);
            calculateEstimate();
        });
    });

    // Event Listeners - Assigned before logic starts to ensure reliability
    if (calculateBtn) calculateBtn.addEventListener('click', () => {
        // Only clear preset if manual space dimensions are actually entered
        const hasManualData = Array.from(document.querySelectorAll('.space-item')).some(item => {
            const w = parseFloat(item.querySelector('.space-width').value);
            const h = parseFloat(item.querySelector('.space-height').value);
            return w > 0 && h > 0;
        });
        if (hasManualData) {
            activePresetQty600 = null;
            presetBtns.forEach(b => b.classList.remove('active'));
        }
        calculateEstimate();
    });
    if (customerNameIpt) customerNameIpt.addEventListener('input', updateContract);
    if (customerPhoneIpt) customerPhoneIpt.addEventListener('input', updateContract);
    if (customerRegionIpt) customerRegionIpt.addEventListener('input', updateContract);
    if (customerAptIpt) customerAptIpt.addEventListener('input', updateContract);
    if (customerSizeIpt) customerSizeIpt.addEventListener('input', updateContract);
    if (customerScopeIpt) customerScopeIpt.addEventListener('input', updateContract);
    if (customerTendencySel) customerTendencySel.addEventListener('change', calculateEstimate);
    // CRM Dropdowns and Checkboxes Instant Bindings
    if (groupPurchaseTier) groupPurchaseTier.addEventListener('change', calculateEstimate);
    if (extraDiscountTier) extraDiscountTier.addEventListener('change', calculateEstimate);
    if (reviewCashChk) reviewCashChk.addEventListener('change', calculateEstimate);
    if (reviewEventChk) reviewEventChk.addEventListener('change', calculateEstimate);
    if (regionDeliveryChk) regionDeliveryChk.addEventListener('change', calculateEstimate);
    if (reinstallChk) reinstallChk.addEventListener('change', calculateEstimate);

    if (matSizeSel) matSizeSel.addEventListener('change', updateBasePrice);
    if (matTypeSel) matTypeSel.addEventListener('change', updateBasePrice);
    
    // Fixed: Ensure the button listener is active and direct
    if (addSpaceBtn) {
        addSpaceBtn.onclick = (e) => {
            e.preventDefault();
            addSpaceEntry();
        };
    }

    safeCreateIcons();

    // Initial State
    updateContract();
    updateBasePrice();
    
    // Ensure all space items (including initial one) have listeners
    document.querySelectorAll('.space-item').forEach(item => {
        item.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', calculateEstimate);
        });
    });

    if (document.querySelectorAll('.space-item').length === 0) {
        addSpaceEntry();
    }

    // Live update when manual discounts in the table change
    document.querySelectorAll('.manual-discount').forEach(ipt => {
        ipt.addEventListener('input', calculateEstimate);
    });

    // --- Specification Tab & Recommendation Control ---
    window.selectModel = function(size, type) {
        // Update hidden inputs
        matSizeSel.value = size;
        matTypeSel.value = type;

        // Update UI Tabs (Internal Result Picker)
        document.querySelectorAll('.size-btn').forEach(btn => {
            if (btn.innerText.includes(size)) {
                // Approximate match for leather since size name might differ
                if (type === 'leather' && btn.innerText.includes('레더')) btn.classList.add('active');
                else if (type === 'standard' && !btn.innerText.includes('레더')) btn.classList.add('active');
                else btn.classList.remove('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update UI Chips (Recommendations)
        document.querySelectorAll('.recommend-chip').forEach(chip => {
            chip.classList.remove('active');
        });

        // Sync main engine
        updateBasePrice();
        calculateEstimate();
        updateContract();
        safeCreateIcons();
    };

    // Attach click events to specification tabs
    document.querySelectorAll('.spec-tab, .res-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            selectModel(tab.dataset.size, tab.dataset.type);
            
            // Sync all related tabs
            document.querySelectorAll('.spec-tab, .res-tab, .size-btn').forEach(t => {
                if (t.dataset.size === tab.dataset.size && t.dataset.type === tab.dataset.type) {
                    t.classList.add('active');
                } else if (t.classList.contains('size-btn')) {
                    // size-btn doesn't use data-size usually, it matches by text
                    if (t.innerText.includes(tab.dataset.size)) {
                         if (tab.dataset.type === 'leather' && t.innerText.includes('레더')) t.classList.add('active');
                         else if (tab.dataset.type === 'standard' && !t.innerText.includes('레더')) t.classList.add('active');
                         else t.classList.remove('active');
                    } else {
                        t.classList.remove('active');
                    }
                } else {
                    t.classList.remove('active');
                }
            });
        });
    });

    if (addSpaceBtn) addSpaceBtn.onclick = (e) => {
        e.preventDefault();
        addSpaceEntry();
    };

    // Space Management Logic
    window.toggleCustomSpace = function(select) {
        const customInput = select.nextElementSibling;
        if (select.value === 'etc') {
            customInput.style.display = 'block';
            customInput.focus();
        } else {
            customInput.style.display = 'none';
        }
        calculateEstimate();
    };

    function addSpaceEntry() {
        const div = document.createElement('div');
        div.className = 'space-item card animate-in';
        div.style = 'padding: 20px; background: #fff; border: 1px solid #eef2ff; margin-bottom: 20px; position: relative; border-radius: 12px; box-shadow: var(--shadow-soft);';
        div.innerHTML = `
            <button class="remove-btn" style="position: absolute; top: 15px; right: 15px; border: none; background: #f1f3f5; color: #adb5bd; border-radius: 8px; padding: 5px 10px; cursor: pointer; font-size: 14px; transition: all 0.2s;">제거 ✕</button>
            <div class="space-inner-grid" style="display: grid; grid-template-columns: 140px 1fr 1fr; gap: 20px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label>공간 구분</label>
                <select class="space-type" onchange="toggleCustomSpace(this)">
                  <option value="living">거실</option>
                  <option value="hallway">복도</option>
                  <option value="kitchen">주방</option>
                  <option value="room1">방 1</option>
                  <option value="room2">방 2</option>
                  <option value="room3">방 3</option>
                  <option value="alpha">알파룸</option>
                  <option value="etc">직접 입력 (기타)</option>
                </select>
                <input type="text" class="custom-space-name" placeholder="공간명 직접 입력 (예: 펫룸, 펜트하우스)" style="display: none; margin-top: 10px; font-size: 0.9rem; padding: 10px 14px; border: 1.5px solid var(--primary); border-radius: 10px; box-shadow: 0 0 10px rgba(10, 84, 247, 0.1); width: calc(100% - 28px);">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label>가로 (cm)</label>
                <input type="number" class="space-width" placeholder="실측 cm" style="border-radius: 8px;">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label>세로 (cm)</label>
                <input type="number" class="space-height" placeholder="실측 cm" style="border-radius: 8px;">
              </div>
            </div>
        `;
        
        // Remove Functionality
        const removeBtn = div.querySelector('.remove-btn');
        removeBtn.onmouseenter = () => { removeBtn.style.background = '#ff7675'; removeBtn.style.color = '#fff'; };
        removeBtn.onmouseleave = () => { removeBtn.style.background = '#f1f3f5'; removeBtn.style.color = '#adb5bd'; };
        removeBtn.addEventListener('click', () => {
            div.remove();
            calculateEstimate();
        });

        // Auto-calc on dimension change
        div.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', calculateEstimate);
        });
        
        spacesContainer.appendChild(div);
    }

    function updateBasePrice() {
        const size = matSizeSel.value;
        const type = matTypeSel.value;
        const [originalPrice, groupPrice] = pricingMatrix[size][type];
        
        // Sync Dropdown to Analysis Tab (Pulse-Sync left selections to right AI Engine)
        const typeShort = type === 'leather' ? 'lea' : 'std';
        const tabId = `${size}_${typeShort}`;
        const targetTab = document.querySelector(`.analysis-tab[data-id="${tabId}"]`);
        
        if (targetTab && !targetTab.classList.contains('active')) {
            document.querySelectorAll('.analysis-tab').forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = 'white';
                btn.style.color = 'var(--text-main)';
                btn.style.fontWeight = '700';
            });
            targetTab.classList.add('active');
            targetTab.style.background = 'var(--primary)';
            targetTab.style.color = 'white';
            targetTab.style.fontWeight = '800';
        }
        
        // Show Original Price as base
        pricePerMatIpt.value = originalPrice;
        
        // Automatically calculate and show the Group Discount amount per sheet
        const discountAmt = originalPrice - groupPrice;
        discountPerMatIpt.value = discountAmt;
        
        if (appliedUnitPriceBox) appliedUnitPriceBox.style.display = 'none';
        
        // Auto-calculate to update visualizations if values change
        calculateEstimate();
    }

    function updateContract() {
        const name = customerNameIpt.value || '__________';
        const phone = customerPhoneIpt.value || '_________________';
        
        const region = customerRegionIpt.value || '';
        const apt = customerAptIpt.value || '';
        const locationStr = [region, apt].filter(Boolean).join(' ') || '_________________';
        
        const cSize = customerSizeIpt.value || '____';
        const cScope = customerScopeIpt.value || '_________________';

        if(contractBuyer) contractBuyer.textContent = name;
        if(contractBuyerPhone) contractBuyerPhone.textContent = phone;
        if(contractBuyerLocation) contractBuyerLocation.textContent = locationStr;
        if(contractBuyerSize) contractBuyerSize.textContent = cSize;
        if(contractBuyerScope) contractBuyerScope.textContent = cScope;
    }

    function calculateEstimate() {
        const sizeKey = matSizeSel.value;
        const typeKey = matTypeSel.value;
        const matSizeCm = parseFloat(sizeKey) / 10; 
        
        const spaceItems = document.querySelectorAll('.space-item');
        let totalQty = 0;
        let validSpaces = 0;
        let spacesData = [];

        const typeMap = {
            'living': '거실', 'hallway': '복도', 'kitchen': '주방', 
            'room1': '방 1', 'room2': '방 2', 'room3': '방 3', 'room4': '방 4', 'room5': '방 5',
            'alpha': '알파룸', 'etc': '기타'
        };

        let finalTotalQty = 0;
        let isPresetMode = false;

        if (activePresetQty600) {
            isPresetMode = true;
            // Apply size scaling provided by user: 800:56%, 1000:36%, 1200:25%
            let scaleFactor = 1.0;
            if (sizeKey === '800') scaleFactor = 0.56;
            else if (sizeKey === '1000') scaleFactor = 0.36;
            else if (sizeKey === '1200') scaleFactor = 0.25;
            
            finalTotalQty = Math.ceil(activePresetQty600 * scaleFactor);
        } else {
            spaceItems.forEach(item => {
                const w = parseFloat(item.querySelector('.space-width').value);
                const h = parseFloat(item.querySelector('.space-height').value);
                const typeSel = item.querySelector('.space-type');
                const customName = item.querySelector('.custom-space-name').value;
                
                let typeName = typeMap[typeSel.value] || '공간';
                if (typeSel.value === 'etc' && customName) {
                    typeName = customName;
                }
                
                if (w > 0 && h > 0) {
                    const cols = Math.ceil(w / matSizeCm);
                    const rows = Math.ceil(h / matSizeCm);
                    totalQty += (cols * rows);
                    validSpaces++;
                    spacesData.push({
                        typeName: typeName,
                        w: w, h: h,
                        cols: cols, rows: rows
                    });
                }
            });
            if (validSpaces === 0) return;
            finalTotalQty = totalQty;
        }

        const manualDiscounts = {};
        document.querySelectorAll('.manual-discount').forEach(ipt => {
            const size = ipt.dataset.size;
            const type = ipt.dataset.type;
            if (!manualDiscounts[size]) manualDiscounts[size] = {};
            const val = parseInt(ipt.value) || 0;
            manualDiscounts[size][type] = val;

            // Live Update the table's "Final Price" column
            const finalSpan = document.querySelector(`.price-row-final[data-size="${size}"][data-type="${type}"]`);
            if (finalSpan) {
                const basePriceArray = pricingMatrix[size][type] || pricingMatrix[size]['standard'] || pricingMatrix[size]['leather'];
                if (basePriceArray) {
                    const finalUnit = Math.max(0, basePriceArray[0] - val);
                    finalSpan.textContent = finalUnit.toLocaleString();
                }
            }
        });

        function getDiscountFor(size, type) {
            if (manualDiscounts[size]) {
                if (manualDiscounts[size][type] !== undefined) return manualDiscounts[size][type];
                if (manualDiscounts[size]['all'] !== undefined) return manualDiscounts[size]['all'];
            }
            return 0;
        }

        // Special case: 1200 is Leather only
        if (sizeKey === '1200' && typeKey === 'standard') {
            matTypeSel.value = 'leather';
            // updateBasePrice() calls calculateEstimate(), so we stop here to avoid recursion
            updateBasePrice();
            return;
        }

        const basePrices = pricingMatrix[sizeKey][typeKey];
        if (!basePrices) {
            console.warn('Pricing not found for:', sizeKey, typeKey);
            return;
        }

        const [originalPrice, promoPrice] = basePrices;
        const totalQtyWithSpare = finalTotalQty; // Spare physically disconnected per latest business rule
        
        // 1. Mat-unit Discounts
        let unitDiscount = parseInt(groupPurchaseTier.value || 0) + 
                           parseInt(extraDiscountTier.value || 0) + 
                           (reviewCashChk && reviewCashChk.checked ? 1000 : 0);
        
        // 2. Flat Discounts
        const refCount = parseInt(referralCountIpt.value || 0);
        // Exclusivity: Group discount prevents Referral discount
        const referralDiscountFlat = (parseInt(groupPurchaseTier.value) === 0) ? (refCount * 50000) : 0;
        const eventDiscountFlat = (reviewEventChk && reviewEventChk.checked ? 30000 : 0);
        const totalFlatDiscount = referralDiscountFlat + eventDiscountFlat;

        // 3. Fees and Logistics
        const qty600eq = (sizeKey === '600') ? totalQtyWithSpare : 
                         (sizeKey === '800') ? totalQtyWithSpare / 0.56 :
                         (sizeKey === '1000') ? totalQtyWithSpare / 0.36 :
                         (sizeKey === '1200') ? totalQtyWithSpare / 0.25 : totalQtyWithSpare;

        let installFee = 0;
        if (qty600eq >= 41 && qty600eq <= 69) installFee = 100000;

        const deliveryFee = (regionDeliveryChk && regionDeliveryChk.checked ? 100000 : 0);
        const reinstallFee = (reinstallChk && reinstallChk.checked ? 450000 : 0);
        const totalFees = installFee + deliveryFee + reinstallFee;

        // --- Final Price Assembly ---
        const baseTotal = totalQtyWithSpare * originalPrice;
        const discountPriceDiff = (originalPrice - promoPrice); // Basic system discount
        
        const systemDiscountTotal = totalQtyWithSpare * discountPriceDiff;
        const extraDiscountTotal = (totalQtyWithSpare * unitDiscount) + totalFlatDiscount;
        
        const finalPrice = Math.max(0, baseTotal - systemDiscountTotal - extraDiscountTotal + totalFees);

        // 4. Update the contract final price
        if (contractTotal) contractTotal.textContent = finalPrice.toLocaleString();

        // Breakdown Info Section
        if (infoBasePrice) infoBasePrice.textContent = baseTotal.toLocaleString();
        if (infoSpecialDiscount) infoSpecialDiscount.textContent = systemDiscountTotal.toLocaleString();
        if (infoAddDiscount) infoAddDiscount.textContent = extraDiscountTotal.toLocaleString();
        if (infoInstallFee) infoInstallFee.textContent = totalFees.toLocaleString();
        if (infoFinalPrice) infoFinalPrice.textContent = finalPrice.toLocaleString();

        // Update Floating Bottom Bar
        const baQty = document.getElementById('ba_qty');
        const baTotal = document.getElementById('ba_total');
        if (baQty) baQty.textContent = totalQtyWithSpare.toLocaleString() + '장';
        if (baTotal) baTotal.textContent = finalPrice.toLocaleString() + '원';


        if (contractTotal) contractTotal.textContent = finalPrice.toLocaleString();

        // --- Standardized Calculation Helper for Multi-Size Comparison ---
        function getComputedPrice(sizeIn, typeIn, spacesArray) {
            const sizeKeyIn = sizeIn.toString();
            const typeKeyIn = typeIn;
            const sizeCmIn = parseFloat(sizeKeyIn) / 10;
            const pricesIn = pricingMatrix[sizeKeyIn][typeKeyIn] || pricingMatrix[sizeKeyIn]['leather'] || pricingMatrix[sizeKeyIn]['standard'] || [0, 0];
            const [orig, prom] = pricesIn;

            let sTotalQty = 0;
            if (isPresetMode) {
                let scaleFactor = 1.0;
                if (sizeKeyIn === '800') scaleFactor = 0.56;
                else if (sizeKeyIn === '1000') scaleFactor = 0.36;
                else if (sizeKeyIn === '1200') scaleFactor = 0.25;
                sTotalQty = Math.ceil(activePresetQty600 * scaleFactor);
            } else {
                spacesArray.forEach(sp => {
                    const c = Math.ceil(sp.w / sizeCmIn);
                    const r = Math.ceil(sp.h / sizeCmIn);
                    sTotalQty += (c * r);
                });
            }

            const qtyWithSpare = sTotalQty;
            
            // Replicate promotion logic
            let uDisc = parseInt(groupPurchaseTier.value || 0) + 
                        parseInt(extraDiscountTier.value || 0) + 
                        (reviewCashChk && reviewCashChk.checked ? 1000 : 0);
            
            const refC = parseInt(referralCountIpt.value || 0);
            const refD = (parseInt(groupPurchaseTier.value) === 0) ? (refC * 50000) : 0;
            const eveD = (reviewEventChk && reviewEventChk.checked ? 30000 : 0);
            const flatD = refD + eveD;

            // Calculate 600mm-equivalent area for mathematically precise installation fee thresholds
            const scaleF = (sizeKeyIn === '800') ? 0.56 : (sizeKeyIn === '1000') ? 0.36 : (sizeKeyIn === '1200') ? 0.25 : 1.0;
            const qty600eq = qtyWithSpare / scaleF;
            
            let iFee = 0;
            if (qty600eq >= 41 && qty600eq <= 69) iFee = 100000;
            
            // Re-installation demolition baseline
            const reinstallFee = (reinstallChk && reinstallChk.checked) ? 450000 : 0;
            
            const dFee = (regionDeliveryChk && regionDeliveryChk.checked ? 100000 : 0);
            const tFee = iFee + dFee + reinstallFee;

            const bT = qtyWithSpare * orig;
            const sD = qtyWithSpare * (orig - prom);
            const eD = (qtyWithSpare * uDisc) + flatD;
            const fP = Math.max(0, bT - sD - eD + tFee);
            return { total: fP, qty: qtyWithSpare, realQty: sTotalQty, unitOrig: orig, unitProm: prom, bT, sD, eD, iF: tFee };
        }

        // --- Integrated Multi-Size Comparative Dashboard (Tabbed Logic) ---
        const comparisonSection = document.getElementById('comparisonSection');
        const analysisTabs = document.querySelectorAll('.analysis-tab');
        const activeReportGrid = document.getElementById('activeReportGrid');
        
        comparisonSection.style.display = 'block';
        
        // Compute Optimal Recommendation dynamically
        let optimalSize = matSizeSel.value;
        let optimalType = matTypeSel.value;
        let optimalLabel = `HASNOL 추천 사양 (${optimalSize} ${optimalType === 'leather' ? '레더' : '표준'})`;

        if (customerTendencySel) {
            if (customerTendencySel.value === 'budget') {
                optimalSize = '600';
                optimalType = 'standard';
                optimalLabel = 'HASNOL 가성비 추천 사양 (600 표준)';
            } else if (customerTendencySel.value === 'premium') {
                optimalSize = '1000';
                optimalType = 'leather';
                optimalLabel = 'HASNOL 프리미엄 추천 사양 (1000 레더)';
            }
        }

        // Define specifically requested model tiers
        const modelTiers = {
            'rec': { size: optimalSize, type: optimalType, label: optimalLabel },
            '600_std': { size: '600', type: 'standard', label: 'HASNOL 600 표준' },
            '600_lea': { size: '600', type: 'leather', label: 'HASNOL 600 레더' },
            '800_std': { size: '800', type: 'standard', label: 'HASNOL 800 표준' },
            '800_lea': { size: '800', type: 'leather', label: 'HASNOL 800 레더' },
            '1000_lea': { size: '1000', type: 'leather', label: 'HASNOL 1000 레더' },
            '1200_lea': { size: '1200', type: 'leather', label: 'HASNOL 1200 레더' }
        };

        // Re-attach tab events (Pulse Sync)
        analysisTabs.forEach(tab => {
            tab.onclick = () => {
                analysisTabs.forEach(t => t.classList.remove('active'));
                analysisTabs.forEach(t => { t.style.background = 'white'; t.style.color = 'var(--text-main)'; t.style.fontWeight = '700'; });
                
                tab.classList.add('active');
                tab.style.background = 'var(--primary)';
                tab.style.color = 'white';
                tab.style.fontWeight = '800';
                calculateEstimate();
            };
        });

        const activeTab = document.querySelector('.analysis-tab.active');
        const currentTabId = activeTab ? activeTab.dataset.id : 'rec';

        const config = modelTiers[currentTabId];
        const calculated = getComputedPrice(config.size, config.type, spacesData);
        
        // 1. Prepare data for this specific selection's sketch
        const sSizeCm = parseFloat(config.size) / 10;
        const sSpacesData = spacesData.map(sp => ({
            ...sp,
            cols: Math.ceil(sp.w / sSizeCm),
            rows: Math.ceil(sp.h / sSizeCm)
        }));

        // 2. Render Simulation on the Left
        renderSketch(sSpacesData, sketchPad);

        // 3. Render the Specific Analysis Card on the Right
        activeReportGrid.innerHTML = `
            <div class="card animate-in" style="border: 2.5px solid var(--primary); padding: 35px; background: #fff; box-shadow: var(--shadow-premium); border-radius: 20px; position: relative;">
                <div style="position: absolute; top: -15px; left: 20px; background: var(--primary); color: white; padding: 4px 15px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em;">AI ESTIMATE : SELECT SPEC</div>
                
                <h3 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 25px; letter-spacing: -0.05em;">
                    ${config.label}
                </h3>

                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 15px;">
                    <span style="color: var(--text-muted); font-weight: 600;">시공 예상 수량</span>
                    <div style="text-align: right;">
                        <span style="font-size: 1.4rem; font-weight: 800; color: var(--primary);">${calculated.qty.toLocaleString()}장</span>
                        <small style="display: block; font-size: 0.75rem; color: #8e8e93;">(시공 구조에 따라 오차 10장 내외 발생가능)</small>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px;">
                    <span style="color: var(--text-muted); font-size: 0.95rem;">기초 권장가 (장당)</span>
                    <span style="color: #767676; text-decoration: line-through;">${calculated.unitOrig.toLocaleString()}원</span>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 25px;">
                    <span style="color: var(--primary); font-size: 0.95rem; font-weight: 800;">특별 특가 (장당)</span>
                    <span style="font-size: 1.3rem; font-weight: 800; color: var(--text-main);">${calculated.unitProm.toLocaleString()}원</span>
                </div>

                <ul style="border-top: 1px solid #eef2ff; margin-top: 25px; padding-top: 20px; padding-left: 20px; font-size: 0.85rem; color: #444; line-height: 1.8; margin-bottom: 0;">
                    <li>기본 권장 및 설치 단가: ${calculated.bT.toLocaleString()}원</li>
                    <li>규격별 특별 프로모션 적용: -${calculated.sD.toLocaleString()}원</li>
                    <li>
                        공구/짝궁/후기/혜택 합계: -${calculated.eD.toLocaleString()}원
                        ${extraDiscountTier.value > 0 ? `<br><span style="color: var(--primary); font-size: 0.75rem; font-weight: 700; display: inline-block; margin-top: 4px;">(✔️ 적용 품목: ${extraDiscountTier.options[extraDiscountTier.selectedIndex].text})</span>` : ''}
                    </li>
                    <li style="color: var(--primary); font-weight: 700;">수량별 시공 분담금 및 물류비: +${calculated.iF.toLocaleString()}원</li>
                </ul>

                <div style="background: #f8faff; border-radius: 15px; padding: 25px; margin-top: 25px; border: 1px solid #eef2ff;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-weight: 700; color: var(--text-main);">최종 확정 견적</span>
                        <span style="font-size: 1.8rem; font-weight: 800; color: var(--primary); letter-spacing: -0.04em;">${calculated.total.toLocaleString()}원</span>
                    </div>
                    <p style="font-size: 0.75rem; color: var(--text-muted); text-align: right;">* 물류/시공 분담금 및 추가 혜택 일괄 적용 기준</p>
                </div>

                <button class="btn btn-primary" style="width: 100%; margin-top: 25px; padding: 18px; font-weight: 800; border-radius: 15px;" onclick="applyFromTab('${config.size}', '${config.type}')">
                    해당 규격으로 견적 및 계약서 적용
                </button>
            </div>
        `;

        // --- AI Comparison Summary Matrix (Financial Overview) ---
        (function renderComparisonTable(sData) {
            const tableContainer = document.getElementById('comparisonSummaryTable');
            if (!tableContainer) return;
            
            const tiers = [
                { id: '600_std', size: '600', type: 'standard', name: '600 표준' },
                { id: '600_lea', size: '600', type: 'leather', name: '600 레더' },
                { id: '800_std', size: '800', type: 'standard', name: '800 표준' },
                { id: '800_lea', size: '800', type: 'leather', name: '800 레더' },
                { id: '1000_lea', size: '1000', type: 'leather', name: '1000 레더' },
                { id: '1200_lea', size: '1200', type: 'leather', name: '1200 레더' }
            ];

            const activeTabItem = document.querySelector('.analysis-tab.active');
            const activeTabIdVal = activeTabItem ? activeTabItem.dataset.id : 'rec';

            let html = `
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>공간 적합 규격</th>
                            <th>예상 소요량</th>
                            <th>할인 특가 (장당)</th>
                            <th>최종 제안 총액</th>
                            <th>상태</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            tiers.forEach(tier => {
                const data = getComputedPrice(tier.size, tier.type, sData);
                const isActive = (activeTabIdVal === tier.id);
                
                html += `
                    <tr class="summary-row ${isActive ? 'active' : ''}">
                        <td style="font-weight: 700;">${tier.name}</td>
                        <td>${data.qty}장</td>
                        <td>${data.unitProm.toLocaleString()}원</td>
                        <td class="financial-cell">${data.total.toLocaleString()}원</td>
                        <td>
                            ${isActive ? '<span style="color:var(--primary); font-size:0.7rem;">● 분석중</span>' : `<button class="preset-chip" style="font-size:0.65rem; padding:4px 8px;" onclick="document.querySelector('.analysis-tab[data-id=\\'${tier.id}\\']').click()">비전환</button>`}
                        </td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
            tableContainer.innerHTML = html;
        })(spacesData);

        // --- Render Side Price Matrix (Right Sidebar) ---
        (function renderSidePriceMatrix(sData) {
            const sideContainer = document.getElementById('sidePriceMatrix');
            if (!sideContainer) return;

            const tiers = [
                { size: '600', type: 'standard', name: '600 표준' },
                { size: '800', type: 'standard', name: '800 표준' },
                { size: '800', type: 'leather', name: '800 레더' },
                { size: '1000', type: 'leather', name: '1000 레더' },
                { size: '1200', type: 'leather', name: '1200 레더' }
            ];

            const currentSize = matSizeSel.value;
            const currentType = matTypeSel.value;

            sideContainer.innerHTML = tiers.map(tier => {
                const data = getComputedPrice(tier.size, tier.type, sData);
                const isActive = (currentSize === tier.size && currentType === tier.type);
                
                return `
                    <div class="side-price-item ${isActive ? 'active' : ''}" onclick="selectModel('${tier.size}', '${tier.type}')" style="cursor:pointer; padding: 15px 10px; border-bottom: 1px solid #f2f2f7;">
                        <div style="flex: 1;">
                            <div style="font-weight: 800; font-size: 0.9rem; color: ${isActive ? 'var(--primary)' : 'var(--text-main)'};">${tier.name}</div>
                            <div style="font-size: 0.7rem; color: #888;">예상 ${data.qty}장</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.95rem; font-weight: 800; color: var(--primary);">${data.total.toLocaleString()}원</div>
                            <div style="font-size: 0.65rem; color: #aaa; text-decoration: line-through;">기존 ${data.bT.toLocaleString()}원</div>
                        </div>
                    </div>
                `;
            }).join('');
        })(spacesData);
    }

    window.applyFromTab = function(size, type) {
        selectModel(size, type);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    function renderSketch(spacesData, targetContainer = null) {
        const container = targetContainer || sketchPad;
        container.innerHTML = '';

        const scan = document.createElement('div');
        scan.className = 'scan-line';
        container.appendChild(scan);

        if (spacesData.length === 0) {
            const msg = document.createElement('p');
            msg.style = 'color:#aaa; font-weight:500; position:relative; z-index:10;';
            msg.innerHTML = '가로, 세로 값을 입력하면<br>AI가 공간별로 분석하여 배치를 그려냅니다.';
            container.appendChild(msg);
            return;
        }

        // --- SVG AutoCAD-style floor plan ---
        const NS = 'http://www.w3.org/2000/svg';
        const TILE_PX = 22;
        const GAP = 36;
        const PAD = 28;
        const DIM = 18; // space above for dimension label

        // Compute layout
        let totalW = PAD;
        let maxH = 0;
        const layouts = spacesData.map(sp => {
            const rw = sp.cols * TILE_PX;
            const rh = sp.rows * TILE_PX;
            const x = totalW;
            totalW += rw + GAP;
            maxH = Math.max(maxH, rh);
            return { ...sp, rw, rh, x };
        });
        totalW += PAD - GAP;
        const totalH = PAD + DIM + maxH + DIM + PAD;
        const svgW = Math.max(320, totalW);
        const svgH = Math.max(200, totalH);

        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', svgH);
        svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
        svg.style.cssText = 'display:block; position:relative; z-index:10; overflow:visible;';

        // Defs: tile fill pattern
        const defs = document.createElementNS(NS, 'defs');
        const pat = document.createElementNS(NS, 'pattern');
        pat.setAttribute('id', 'tilePat');
        pat.setAttribute('width', TILE_PX);
        pat.setAttribute('height', TILE_PX);
        pat.setAttribute('patternUnits', 'userSpaceOnUse');
        const patRect = document.createElementNS(NS, 'rect');
        patRect.setAttribute('width', TILE_PX);
        patRect.setAttribute('height', TILE_PX);
        patRect.setAttribute('fill', 'rgba(0,91,181,0.07)');
        patRect.setAttribute('stroke', 'rgba(0,91,181,0.22)');
        patRect.setAttribute('stroke-width', '0.6');
        pat.appendChild(patRect);
        defs.appendChild(pat);
        svg.appendChild(defs);

        function el(tag, attrs) {
            const e = document.createElementNS(NS, tag);
            for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
            return e;
        }
        function txt(x, y, content, attrs) {
            const t = document.createElementNS(NS, 'text');
            t.setAttribute('x', x); t.setAttribute('y', y);
            for (const [k, v] of Object.entries(attrs)) t.setAttribute(k, v);
            t.textContent = content;
            return t;
        }

        layouts.forEach(sp => {
            const rx = sp.x;
            const ry = PAD + DIM;

            // Tile fill
            svg.appendChild(el('rect', { x: rx, y: ry, width: sp.rw, height: sp.rh, fill: 'url(#tilePat)' }));

            // Vertical grid lines
            for (let c = 0; c <= sp.cols; c++) {
                const lx = rx + c * TILE_PX;
                const isEdge = c === 0 || c === sp.cols;
                svg.appendChild(el('line', {
                    x1: lx, y1: ry, x2: lx, y2: ry + sp.rh,
                    stroke: isEdge ? '#005bb5' : 'rgba(0,91,181,0.25)',
                    'stroke-width': isEdge ? '2' : '0.5'
                }));
            }
            // Horizontal grid lines
            for (let r = 0; r <= sp.rows; r++) {
                const ly = ry + r * TILE_PX;
                const isEdge = r === 0 || r === sp.rows;
                svg.appendChild(el('line', {
                    x1: rx, y1: ly, x2: rx + sp.rw, y2: ly,
                    stroke: isEdge ? '#005bb5' : 'rgba(0,91,181,0.25)',
                    'stroke-width': isEdge ? '2' : '0.5'
                }));
            }

            // Dimension ticks & labels — top (width)
            const dimY = ry - 8;
            svg.appendChild(el('line', { x1: rx, y1: dimY, x2: rx + sp.rw, y2: dimY, stroke: '#5a7fb5', 'stroke-width': '1', 'stroke-dasharray': '3,2' }));
            svg.appendChild(el('line', { x1: rx, y1: dimY - 4, x2: rx, y2: dimY + 4, stroke: '#5a7fb5', 'stroke-width': '1.5' }));
            svg.appendChild(el('line', { x1: rx + sp.rw, y1: dimY - 4, x2: rx + sp.rw, y2: dimY + 4, stroke: '#5a7fb5', 'stroke-width': '1.5' }));
            svg.appendChild(txt(rx + sp.rw / 2, dimY - 10, `${sp.w}cm`, {
                'text-anchor': 'middle', 'font-size': '10', fill: '#005bb5', 'font-weight': '700', 'font-family': 'monospace'
            }));

            // Dimension ticks — right (height)
            const dimX = rx + sp.rw + 8;
            svg.appendChild(el('line', { x1: dimX, y1: ry, x2: dimX, y2: ry + sp.rh, stroke: '#5a7fb5', 'stroke-width': '1', 'stroke-dasharray': '3,2' }));
            svg.appendChild(el('line', { x1: dimX - 4, y1: ry, x2: dimX + 4, y2: ry, stroke: '#5a7fb5', 'stroke-width': '1.5' }));
            svg.appendChild(el('line', { x1: dimX - 4, y1: ry + sp.rh, x2: dimX + 4, y2: ry + sp.rh, stroke: '#5a7fb5', 'stroke-width': '1.5' }));
            const dimTxt = txt(dimX + 5, ry + sp.rh / 2, `${sp.h}cm`, {
                'text-anchor': 'start', 'dominant-baseline': 'middle', 'font-size': '10', fill: '#005bb5', 'font-weight': '700', 'font-family': 'monospace'
            });
            svg.appendChild(dimTxt);

            // Center room label
            const lblBg = el('rect', {
                x: rx + sp.rw / 2 - 30, y: ry + sp.rh / 2 - 9,
                width: 60, height: 18, fill: 'rgba(255,255,255,0.88)', rx: '4'
            });
            svg.appendChild(lblBg);
            svg.appendChild(txt(rx + sp.rw / 2, ry + sp.rh / 2 + 1, sp.typeName, {
                'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': '11', fill: '#003d7a', 'font-weight': '800'
            }));

            // Below: tile count
            svg.appendChild(txt(rx + sp.rw / 2, ry + sp.rh + DIM - 2, `${sp.cols}×${sp.rows} = ${sp.cols * sp.rows}장`, {
                'text-anchor': 'middle', 'font-size': '9.5', fill: '#888', 'font-weight': '600', 'font-family': 'monospace'
            }));
        });

        container.appendChild(svg);
    }

    // --- Price Comparison Table Logic ---
    function updateFullPricingComparison() {
        const tableContainer = document.getElementById('fullPricingComparison');
        if (!tableContainer) return;

        const sizes = [
            { size: '600', type: 'standard', name: '600 표준' },
            { size: '800', type: 'standard', name: '800 표준' },
            { size: '800', type: 'leather', name: '800 레더' },
            { size: '1000', type: 'leather', name: '1000 레더' },
            { size: '1200', type: 'leather', name: '1200 레더' }
        ];

        // Get current space data
        const currentSpaces = [];
        document.querySelectorAll('.space-item').forEach(item => {
            const w = parseFloat(item.querySelector('.space-width').value);
            const h = parseFloat(item.querySelector('.space-height').value);
            if (w > 0 && h > 0) currentSpaces.push({ w, h });
        });

        if (currentSpaces.length === 0 && !activePresetQty600) {
            tableContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">견적을 입력하시면 규격별 비교 데이터가 출력됩니다.</p>';
            return;
        }

        let html = `
            <table style="width:100%; border-collapse: collapse; font-size: 0.85rem; text-align: center; border: 1px solid #eee;">
                <thead style="background: #f8faff;">
                    <tr style="border-bottom: 1px solid #eee;">
                        <th style="padding: 12px 10px;">모델</th>
                        <th style="padding: 12px 10px;">수량</th>
                        <th style="padding: 12px 10px;">단가</th>
                        <th style="padding: 12px 10px;">총 예상견적</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sizes.forEach(s => {
            const data = getComputedPrice(s.size, s.type, currentSpaces);
            const isSelected = matSizeSel.value === s.size && matTypeSel.value === s.type;
            
            html += `
                <tr style="border-bottom: 1px solid #f8f8fa; ${isSelected ? 'background: #f0f4ff; font-weight: 700;' : ''}">
                    <td style="padding: 12px 10px; font-weight: 700;">${s.name}</td>
                    <td style="padding: 12px 10px;">${data.qty}장</td>
                    <td style="padding: 12px 10px;">${data.unitProm.toLocaleString()}원</td>
                    <td style="padding: 12px 10px; color: var(--primary); font-weight: 800;">${data.total.toLocaleString()}원</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
        tableContainer.innerHTML = html;
    }

    // Wrap the original calculateEstimate to include our new table update
    const baseCalculateEstimate = calculateEstimate;
    calculateEstimate = function() {
        baseCalculateEstimate();
        updateFullPricingComparison();
        updateContractEstimateSummary();
    };

    // --- Contract Estimate Summary Injection ---
    function updateContractEstimateSummary() {
        const summaryBox = document.getElementById('contractEstimateSummary');
        if (!summaryBox) return;

        // Gather customer info
        const name = document.getElementById('customerName')?.value || '미입력';
        const phone = document.getElementById('customerPhone')?.value || '미입력';
        const region = document.getElementById('customerRegion')?.value || '미입력';
        const apt = document.getElementById('customerApt')?.value || '미입력';
        const size = document.getElementById('customerSize')?.value || '미입력';
        const scope = document.getElementById('customerScope')?.value || '미입력';
        const dateVal = document.getElementById('estimateDate')?.value || new Date().toISOString().slice(0, 10);
        const sizeLabel = matSizeSel?.value ? `${matSizeSel.value}mm` : '-';
        const typeLabel = matTypeSel?.value === 'leather' ? '레더' : '표준';

        // Clone the comparison summary table HTML
        const compTable = document.getElementById('comparisonSummaryTable');
        const compTableHTML = compTable ? compTable.innerHTML : '';

        // Clone the active detail card HTML
        const detailCard = document.getElementById('activeReportGrid');
        const detailCardHTML = detailCard ? detailCard.innerHTML : '';

        summaryBox.style.display = 'block';
        summaryBox.innerHTML = `
            <!-- 발행 정보 + 고객 정보 -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:30px; border:1px solid #eef2ff; border-radius:16px; padding:20px; background:#f8faff;">
              <div>
                <div style="font-size:0.7rem; font-weight:800; color:var(--primary); letter-spacing:0.1em; margin-bottom:10px;">📋 견적 발행 정보</div>
                <table style="width:100%; font-size:0.85rem; border-collapse:collapse;">
                  <tr><td style="color:#888; padding:4px 0; width:80px;">발행일</td><td style="font-weight:700;">${dateVal}</td></tr>
                  <tr><td style="color:#888; padding:4px 0;">선택 규격</td><td style="font-weight:700;">${sizeLabel} ${typeLabel}</td></tr>
                </table>
              </div>
              <div>
                <div style="font-size:0.7rem; font-weight:800; color:var(--primary); letter-spacing:0.1em; margin-bottom:10px;">👤 고객 정보</div>
                <table style="width:100%; font-size:0.85rem; border-collapse:collapse;">
                  <tr><td style="color:#888; padding:4px 0; width:80px;">고객명</td><td style="font-weight:700;">${name}</td></tr>
                  <tr><td style="color:#888; padding:4px 0;">연락처</td><td style="font-weight:600;">${phone}</td></tr>
                  <tr><td style="color:#888; padding:4px 0;">지역</td><td style="font-weight:600;">${region}</td></tr>
                  <tr><td style="color:#888; padding:4px 0;">시설명</td><td style="font-weight:600;">${apt}</td></tr>
                  <tr><td style="color:#888; padding:4px 0;">평형</td><td style="font-weight:600;">${size}</td></tr>
                  <tr><td style="color:#888; padding:4px 0;">시공범위</td><td style="font-weight:600;">${scope}</td></tr>
                </table>
              </div>
            </div>

            <!-- 비교 견적표 -->
            <div style="margin-bottom:30px;">
              <div style="font-size:0.7rem; font-weight:800; color:var(--primary); letter-spacing:0.1em; margin-bottom:12px; padding:8px 14px; background:var(--primary); color:white; border-radius:8px; display:inline-block;">📊 규격별 비교 견적표</div>
              <div style="border:1px solid #eef2ff; border-radius:12px; overflow:hidden;">
                ${compTableHTML}
              </div>
            </div>

            <!-- 선택 규격 상세 견적 -->
            <div>
              <div style="font-size:0.7rem; font-weight:800; letter-spacing:0.1em; margin-bottom:12px; padding:8px 14px; background:#1a1a2e; color:white; border-radius:8px; display:inline-block;">💎 선택 규격 상세 견적 (${sizeLabel} ${typeLabel})</div>
              <div style="border:1px solid #eef2ff; border-radius:12px; overflow:hidden; padding:20px;">
                ${detailCardHTML}
              </div>
            </div>
        `;
    }

    // Helper to get computed price for any size/type combination
    function getComputedPrice(sizeIn, typeIn, spacesArray) {
        const sizeKeyIn = sizeIn.toString();
        const typeKeyIn = typeIn;
        const sizeCmIn = parseFloat(sizeKeyIn) / 10;
        const pricesIn = pricingMatrix[sizeKeyIn][typeKeyIn] || [0, 0];
        const [orig, prom] = pricesIn;

        let sTotalQty = 0;
        if (activePresetQty600) {
            let scaleFactor = 1.0;
            if (sizeKeyIn === '800') scaleFactor = 0.56;
            else if (sizeKeyIn === '1000') scaleFactor = 0.36;
            else if (sizeKeyIn === '1200') scaleFactor = 0.25;
            sTotalQty = Math.ceil(activePresetQty600 * scaleFactor);
        } else {
            spacesArray.forEach(sp => {
                const c = Math.ceil(sp.w / sizeCmIn);
                const r = Math.ceil(sp.h / sizeCmIn);
                sTotalQty += (c * r);
            });
        }

        // Apply same discount logic as main engine
        let unitDiscount = parseInt(groupPurchaseTier.value || 0) + 
                           parseInt(extraDiscountTier.value || 0) + 
                           (reviewCashChk && reviewCashChk.checked ? 1000 : 0);
        
        const refCount = parseInt(referralCountIpt.value || 0);
        const referralDiscountFlat = (parseInt(groupPurchaseTier.value) === 0) ? (refCount * 50000) : 0;
        const eventDiscountFlat = (reviewEventChk && reviewEventChk.checked ? 30000 : 0);
        
        const scaleF2 = (sizeKeyIn === '800') ? 0.56 : (sizeKeyIn === '1000') ? 0.36 : (sizeKeyIn === '1200') ? 0.25 : 1.0;
        const qty600eq2 = sTotalQty / scaleF2;
        let installFee = 0;
        if (qty600eq2 >= 41 && qty600eq2 <= 69) installFee = 100000;
        
        const deliveryFee = (regionDeliveryChk && regionDeliveryChk.checked ? 100000 : 0);
        
        const baseTotal = sTotalQty * orig;
        const systemDiscountTotal = sTotalQty * (orig - prom);
        const extraDiscountTotal = (sTotalQty * unitDiscount) + referralDiscountFlat + eventDiscountFlat;
        
        const finalPrice = Math.max(0, baseTotal - systemDiscountTotal - extraDiscountTotal + installFee + deliveryFee);
        
        return { 
            total: finalPrice, 
            qty: sTotalQty, 
            unitProm: prom,
            unitOrig: orig,
            bT: baseTotal,
            sD: systemDiscountTotal,
            eD: extraDiscountTotal,
            iF: installFee + deliveryFee
        };
    }

    // --- Official Certification Data ---
    const certifications = [
        { title: 'SGS 충격흡수 98%', body: '글로벌 안전성 인증', icon: 'shield-check', url: 'https://www.hasnol.kr/certification' },
        { title: 'KOTITI 라돈안심', body: '방사능 안전 테스트 완료', icon: 'wind', url: 'https://www.hasnol.kr/certification' },
        { title: 'KTR 난연인증', body: 'UL 94 V-2 등급 획득', icon: 'flame', url: 'https://www.hasnol.kr/certification' },
        { title: 'KC 어린이제품', body: '유해물질 불검출 인증', icon: 'baby', url: 'https://www.hasnol.kr/certification' },
        { title: 'KSPO 공식인정', body: '충격흡수율 73.6% 인정', icon: 'award', url: 'https://www.hasnol.kr/certification' },
        { title: '아토피 안심', body: '영유아 피부안전 통과', icon: 'heart', url: 'https://www.hasnol.kr/certification' },
        { title: '반려동물 친환경', body: 'KACI 향균 및 안전 통과', icon: 'dog', url: 'https://www.hasnol.kr/certification' },
        { title: 'ISO 9001:2015', body: '국제 품질 경영 표준', icon: 'globe', url: 'https://www.hasnol.kr/certification' }
    ];

    // --- Dynamic Review Data (Crawled from Naver/Insta) ---
    const reviewData = [
        {
          title: "하늘매트 내돈내산 - 확실한 시각적 개방감",
          desc: "책장 틈새까지 정교하게 시공되어 인테리어 드라마틱함",
          url: "https://cafe.naver.com/imsanbu/74757624",
          tag: "BEST", icon: "🏠", size: "800", type: "leather"
        },
        {
          title: "아기 배밀이 필수템, 만족도 100%",
          desc: "집이 밝아 보이고 층간소음 걱정이 사라졌어요",
          url: "https://cafe.naver.com/smartkim82/3443",
          tag: "BABY", icon: "👶", size: "600", type: "standard"
        },
        {
          title: "2시간 만에 끝난 거실 복도 시공 후기",
          desc: "베이지 컬러의 화사함과 촉감이 강점인 하늘매트",
          url: "https://cafe.naver.com/overseer/1299417",
          tag: "FAST", icon: "🛋️", size: "800", type: "leather"
        },
        {
          title: "다양한 매트 비교 끝에 선택한 결과",
          desc: "합리적인 가격과 전문적인 시공 품질에 대만족",
          url: "https://cafe.naver.com/smartkim82/3460",
          tag: "REVIEW", icon: "🌟", size: "1000", type: "leather"
        },
        {
          title: "셀프 시공에도 가성비 최고인 하늘매트",
          desc: "전문가 도움 없이도 인테리어 효과가 뛰어남",
          url: "https://cafe.naver.com/imsanbu/77909136",
          tag: "DIY", icon: "🛠️", size: "1200", type: "leather"
        }
    ];

    function renderCertifications() {
        const vault = document.getElementById('certVault');
        if (!vault) return;
        vault.innerHTML = certifications.map(cert => `
            <a href="${cert.url}" target="_blank" style="text-decoration: none; display: block; padding: 15px; background: white; border-radius: 12px; border: 1px solid #eef2ff; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.02); transition: transform 0.2s;">
                <i data-lucide="${cert.icon}" style="width: 20px; color: var(--primary); margin-bottom: 8px;"></i>
                <h5 style="font-size: 0.8rem; font-weight: 800; margin-bottom: 4px; color: var(--text-main);">${cert.title}</h5>
                <p style="font-size: 0.65rem; color: #888;">${cert.body}</p>
            </a>
        `).join('');
        safeCreateIcons();
    }

    function updateDynamicReviews(selectedSize, selectedType) {
        const container = document.getElementById('dynamicReviews');
        if (!container) return;
        
        // Filter reviews that match size OR type, or default to Best
        const filtered = reviewData.filter(r => r.size === selectedSize || r.type === selectedType);
        const displayList = filtered.length > 0 ? filtered : reviewData.slice(0, 3);

        container.innerHTML = displayList.map(rev => `
            <a href="${rev.url}" class="review-link" target="_blank">
              <span style="font-size: 1.2rem; margin-right: 15px;">${rev.icon}</span>
              <div>
                <span class="review-meta">${rev.size}mm ${rev.type.toUpperCase()} | ${rev.tag}</span>
                <strong style="font-size: 0.95rem;">${rev.title}</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted);">${rev.desc}</p>
              </div>
            </a>
        `).join('');
    }

    // Initial renders
    try { renderCertifications(); } catch(e) { console.warn('renderCertifications 오류:', e); }
    try { calculateEstimate(); } catch(e) { console.warn('calculateEstimate 초기화 오류:', e); } // Calls updateDynamicReviews inside
    
    // Final Trigger Integration
    const originalCalc = calculateEstimate;
    calculateEstimate = function() {
        originalCalc();
        updateDynamicReviews(matSizeSel.value, matTypeSel.value);
    };

    // --- Digital Signature & PDF Sharing Logic ---
    const sigCanvas = document.getElementById('signaturePad');
    if (sigCanvas) {
        const ctx = sigCanvas.getContext('2d');
        let isDrawing = false;
        
        const getCrossPos = (e) => {
            const rect = sigCanvas.getBoundingClientRect();
            const scaleX = sigCanvas.width / rect.width;
            const scaleY = sigCanvas.height / rect.height;
            if (e.touches && e.touches.length > 0) {
                return {
                    x: (e.touches[0].clientX - rect.left) * scaleX,
                    y: (e.touches[0].clientY - rect.top) * scaleY
                };
            }
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        };

        const startDraw = (e) => {
            isDrawing = true;
            document.getElementById('signPlaceholder').style.display = 'none';
            ctx.beginPath();
            const pos = getCrossPos(e);
            ctx.moveTo(pos.x, pos.y);
            if(e.cancelable) e.preventDefault();
        };

        const drawStroke = (e) => {
            if (!isDrawing) return;
            const pos = getCrossPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#0f172a';
            ctx.stroke();
            if(e.cancelable) e.preventDefault();
        };

        const stopDraw = () => {
            isDrawing = false;
            ctx.closePath();
        };

        sigCanvas.addEventListener('mousedown', startDraw);
        sigCanvas.addEventListener('mousemove', drawStroke);
        sigCanvas.addEventListener('mouseup', stopDraw);
        sigCanvas.addEventListener('mouseout', stopDraw);
        
        sigCanvas.addEventListener('touchstart', startDraw, {passive: false});
        sigCanvas.addEventListener('touchmove', drawStroke, {passive: false});
        sigCanvas.addEventListener('touchend', stopDraw);

        document.getElementById('clearSignBtn').addEventListener('click', () => {
            ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
            document.getElementById('signPlaceholder').style.display = 'block';
        });
    }

    // --- Company Signature Pad (을 / 시공사) ---
    const sigCanvasCompany = document.getElementById('signaturePadCompany');
    if (sigCanvasCompany) {
        const ctx2 = sigCanvasCompany.getContext('2d');
        let isDrawing2 = false;

        const getPos2 = (e) => {
            const rect = sigCanvasCompany.getBoundingClientRect();
            const scaleX = sigCanvasCompany.width / rect.width;
            const scaleY = sigCanvasCompany.height / rect.height;
            if (e.touches && e.touches.length > 0) {
                return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
            }
            return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
        };

        const startDraw2 = (e) => {
            isDrawing2 = true;
            const ph = document.getElementById('signPlaceholderCompany');
            if (ph) ph.style.display = 'none';
            ctx2.beginPath();
            const pos = getPos2(e);
            ctx2.moveTo(pos.x, pos.y);
            if (e.cancelable) e.preventDefault();
        };
        const drawStroke2 = (e) => {
            if (!isDrawing2) return;
            const pos = getPos2(e);
            ctx2.lineTo(pos.x, pos.y);
            ctx2.lineWidth = 3;
            ctx2.lineCap = 'round';
            ctx2.strokeStyle = '#0f172a';
            ctx2.stroke();
            if (e.cancelable) e.preventDefault();
        };
        const stopDraw2 = () => { isDrawing2 = false; ctx2.closePath(); };

        sigCanvasCompany.addEventListener('mousedown', startDraw2);
        sigCanvasCompany.addEventListener('mousemove', drawStroke2);
        sigCanvasCompany.addEventListener('mouseup', stopDraw2);
        sigCanvasCompany.addEventListener('mouseout', stopDraw2);
        sigCanvasCompany.addEventListener('touchstart', startDraw2, {passive: false});
        sigCanvasCompany.addEventListener('touchmove', drawStroke2, {passive: false});
        sigCanvasCompany.addEventListener('touchend', stopDraw2);

        const clearBtn2 = document.getElementById('clearSignBtnCompany');
        if (clearBtn2) clearBtn2.addEventListener('click', () => {
            ctx2.clearRect(0, 0, sigCanvasCompany.width, sigCanvasCompany.height);
            const ph = document.getElementById('signPlaceholderCompany');
            if (ph) ph.style.display = 'block';
        });
    }

    const sharePdfBtn = document.getElementById('sharePdfBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

    // Shared state for generated PDF blob
    let _pdfBlob = null;
    let _pdfFileName = null;

    // Helper: trigger file download from blob
    const downloadBlobFile = (blob, fileName) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    };

    // Core PDF Generation — returns { blob, fileName }
    const buildPDFBlob = async (triggerBtn) => {
        if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            alert('PDF 렌더링 모듈을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
            return null;
        }

        const originalText = triggerBtn.innerHTML;
        triggerBtn.innerHTML = '<span style="font-size:1.1rem;margin-right:5px;">⏳</span> PDF 구성 중...';
        triggerBtn.disabled = true;

        return new Promise((resolve) => {
            setTimeout(async () => {
                try {
                    const elementToCapture = document.querySelector('.container') || document.body;
                    const noPrintElements = document.querySelectorAll('.no-print');
                    const placeholder = document.getElementById('signPlaceholder');
                    const isPlaceholderVisible = placeholder && placeholder.style.display !== 'none';

                    // Prepare for capture
                    const originalScrollY = window.scrollY;
                    window.scrollTo(0, 0);

                    noPrintElements.forEach(el => el.style.display = 'none');
                    if (placeholder) placeholder.style.display = 'none';
                    if (sigCanvas) {
                        sigCanvas.style.border = 'none';
                        sigCanvas.style.background = 'transparent';
                    }

                    const canvasMap = await html2canvas(elementToCapture, {
                        scale: 2, // Higher scale for better quality
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        allowTaint: true,
                        logging: false,
                        onclone: (clonedDoc) => {
                            // Mirror signature to cloned doc
                            const clonedCanvas = clonedDoc.getElementById('signaturePad');
                            if (clonedCanvas && sigCanvas) {
                                const clonedCtx = clonedCanvas.getContext('2d');
                                clonedCtx.drawImage(sigCanvas, 0, 0);
                            }
                        }
                    });

                    // Restore UI
                    noPrintElements.forEach(el => el.style.display = '');
                    if (isPlaceholderVisible && placeholder) placeholder.style.display = 'block';
                    if (sigCanvas) {
                        sigCanvas.style.border = '1.5px dashed #ccc';
                        sigCanvas.style.background = '#fafafa';
                    }
                    window.scrollTo(0, originalScrollY);

                    // PDF Generation
                    const { jsPDF } = window.jspdf;
                    const canvasWidth = canvasMap.width;
                    const canvasHeight = canvasMap.height;
                    const imgData = canvasMap.toDataURL('image/jpeg', 0.95);
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfPageHeight = pdf.internal.pageSize.getHeight();
                    const imgHeightInPdf = (canvasHeight * pdfWidth) / canvasWidth;
                    
                    let heightLeft = imgHeightInPdf;
                    let position = 0;
                    
                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdf);
                    heightLeft -= pdfPageHeight;
                    
                    while (heightLeft > 0) {
                        pdf.addPage();
                        position = heightLeft - imgHeightInPdf;
                        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdf);
                        heightLeft -= pdfPageHeight;
                    }

                    const fileNameDate = new Date().toISOString().slice(0, 10);
                    const fileName = `HASNOL_견적서_${fileNameDate}.pdf`;
                    const blob = pdf.output('blob');

                    resolve({ blob, fileName });
                } catch (error) {
                    console.error('PDF Generate Error', error);
                    alert('PDF 생성 중 오류가 발생했습니다: ' + error.message);
                    resolve(null);
                } finally {
                    triggerBtn.innerHTML = originalText;
                    triggerBtn.disabled = false;
                }
            }, 150);
        });
    };

    // Share Modal Logic
    const shareModal = document.getElementById('shareOptionsModal');
    const closeShareModal = document.getElementById('closeShareModal');

    const openShareModal = () => { shareModal.style.display = 'flex'; };
    const closeModal = () => { shareModal.style.display = 'none'; };

    if (closeShareModal) closeShareModal.addEventListener('click', closeModal);
    shareModal.addEventListener('click', (e) => { if (e.target === shareModal) closeModal(); });

    // 📱 시스템 공유 (navigator.share — 모바일에서 카톡/문자/드라이브 자동 연결)
    document.getElementById('shareNativeBtn').addEventListener('click', async () => {
        closeModal();
        if (!_pdfBlob || !_pdfFileName) return;
        const file = new File([_pdfBlob], _pdfFileName, { type: 'application/pdf' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'HASNOL 하스놀 견적서',
                    text: '하스놀 AI 맞춤 견적서입니다.'
                });
            } catch (e) {
                if (e.name !== 'AbortError') alert('공유 중 오류: ' + e.message);
            }
        } else {
            downloadBlobFile(_pdfBlob, _pdfFileName);
            alert('✅ PDF가 저장되었습니다.\n(이 환경에서는 시스템 공유가 지원되지 않아 다운로드 처리되었습니다)');
        }
    });

    // 💬 문자 보내기
    document.getElementById('shareSMSBtn').addEventListener('click', () => {
        closeModal();
        if (!_pdfBlob || !_pdfFileName) return;
        downloadBlobFile(_pdfBlob, _pdfFileName);
        setTimeout(() => {
            const msg = encodeURIComponent('HASNOL 견적서를 공유합니다. 다운로드된 PDF 파일을 첨부해주세요.');
            const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
            window.location.href = isMobile ? `sms:?&body=${msg}` : `sms:?body=${msg}`;
        }, 800);
    });

    // 💛 카카오톡
    document.getElementById('shareKakaoBtn').addEventListener('click', () => {
        closeModal();
        if (!_pdfBlob || !_pdfFileName) return;
        downloadBlobFile(_pdfBlob, _pdfFileName);
        setTimeout(() => {
            const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
            if (isMobile) {
                window.location.href = 'kakaotalk://';
            } else {
                alert('✅ PDF가 저장되었습니다.\n카카오톡 PC 버전 또는 모바일 앱에서 파일을 첨부하여 전송해주세요.');
            }
        }, 800);
    });

    // 📧 이메일 (기존 일반 공유)
    document.getElementById('shareEmailBtn').addEventListener('click', () => {
        closeModal();
        if (!_pdfBlob || !_pdfFileName) return;
        downloadBlobFile(_pdfBlob, _pdfFileName);
        setTimeout(() => {
            const subject = encodeURIComponent('HASNOL 견적서 공유');
            const body = encodeURIComponent('다운로드된 견적서 PDF 파일을 첨부하여 확인 부탁드립니다.');
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
            alert('✅ PDF가 저장되었습니다.\n이메일 작성이 완료되면 파일을 첨부해 주세요.');
        }, 800);
    });

    // ============================================================
    // ☁️ 구글 드라이브 자동 저장 (Apps Script Web App 연동)
    // ============================================================
    // 👇 Apps Script 배포 후 여기에 웹 앱 URL 붙여넣기
    const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

    async function saveToDrive(blob, fileName) {
        // Blob → Base64 변환
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    // "data:application/pdf;base64," 접두사 제거
                    const base64 = reader.result.split(',')[1];
                    const customerName = document.getElementById('customerName')?.value || '고객';

                    const response = await fetch(APPS_SCRIPT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            pdf: base64,
                            fileName: fileName,
                            customerName: customerName
                        })
                    });

                    const result = await response.json();
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    const shareDriveBtn = document.getElementById('shareDriveBtn');
    if (shareDriveBtn) {
        shareDriveBtn.addEventListener('click', async () => {
            closeModal();
            if (!_pdfBlob || !_pdfFileName) return;

            // Apps Script URL이 설정되지 않은 경우 폴백 처리
            if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
                downloadBlobFile(_pdfBlob, _pdfFileName);
                showToast('⚠️ Apps Script URL 미설정 → PDF를 다운로드했습니다.\n설정 방법은 google_apps_script.gs 파일을 참고하세요.');
                return;
            }

            // 저장 중 상태 표시
            shareDriveBtn.querySelector('span:first-child').textContent = '⏳';
            showToast('☁️ 구글 드라이브에 저장 중...');

            try {
                const result = await saveToDrive(_pdfBlob, _pdfFileName);

                if (result.success) {
                    // 성공 토스트
                    showToast(`✅ 드라이브 저장 완료!\n📄 ${result.fileName}`);

                    // 저장된 파일 링크 열기 (선택)
                    if (result.fileUrl) {
                        setTimeout(() => {
                            if (confirm('✅ 드라이브 저장 완료!\n\n저장된 파일을 바로 열어볼까요?')) {
                                window.open(result.fileUrl, '_blank');
                            }
                        }, 500);
                    }
                } else {
                    throw new Error(result.message || '저장 실패');
                }
            } catch (err) {
                console.error('Drive 저장 오류:', err);
                // 실패 시 폴백: 로컬 다운로드
                downloadBlobFile(_pdfBlob, _pdfFileName);
                showToast('⚠️ 드라이브 연결 실패 → PDF를 다운로드했습니다.\n' + err.message);
            } finally {
                shareDriveBtn.querySelector('span:first-child').textContent = '☁️';
            }
        });
    }

    // ✉️ 고객에게 견적서 이메일 작성 전용 버튼
    const shareCustomerEmailBtn = document.getElementById('shareCustomerEmailBtn');
    const emailComposeModal = document.getElementById('emailComposeModal');
    const closeEmailModal = document.getElementById('closeEmailModal');
    const emailToIpt = document.getElementById('emailTo');
    const emailSubjectIpt = document.getElementById('emailSubject');
    const emailBodyTxt = document.getElementById('emailBody');
    const copyEmailBodyBtn = document.getElementById('copyEmailBodyBtn');
    const sendEmailBtn = document.getElementById('sendEmailBtn');

    function buildEmailContent() {
        const name = customerNameIpt?.value || '고객';
        const phone = customerPhoneIpt?.value || '';
        const region = customerRegionIpt?.value || '';
        const apt = customerAptIpt?.value || '';
        const size = customerSizeIpt?.value || '';
        const scope = customerScopeIpt?.value || '';
        const date = estimateDateIpt?.value || new Date().toLocaleDateString('ko-KR');

        // 현재 선택된 탭의 견적 금액 가져오기
        const priceEl = document.querySelector('#activeReportGrid .card [style*="1.8rem"]');
        const totalPrice = priceEl ? priceEl.textContent.trim() : '산출 견적 참조';

        const subject = `[HASNOL 하스놀] ${name} 고객님 맞춤 견적서 안내`;

        const body = `안녕하세요, ${name} 고객님.

하스놀(HASNOL)입니다. 문의해주신 TPU 프리미엄 바닥매트 시공 견적서를 발송해 드립니다.

━━━━━━━━━━━━━━━━━━━━━━━
📋 견적 기본 정보
━━━━━━━━━━━━━━━━━━━━━━━
• 고객명: ${name}
• 연락처: ${phone || '미기입'}
• 시공 지역: ${[region, apt].filter(Boolean).join(' ') || '미기입'}
• 평형/규모: ${size || '미기입'}
• 시공 범위: ${scope || '미기입'}
• 견적 발행일: ${date}
• 최종 견적 금액: ${totalPrice}원 (부가세 포함)
━━━━━━━━━━━━━━━━━━━━━━━

상세 견적 내용은 첨부된 PDF 파일을 확인해 주세요.

📌 안내 사항:
- 최종 정산은 실제 시공 완료 후 현장 확인 수량 기준입니다.
- 견적 유효기간은 발행일로부터 7일입니다.
- 궁금하신 사항은 언제든지 연락주세요.

☎ 고객 상담: 1660-1195
🏢 주소: 경기도 김포시 누산리 399-6
🌐 홈페이지: www.hasnol.kr

감사합니다.
HASNOL 하스놀 드림`;

        return { subject, body, to: customerEmailIpt?.value || '' };
    }

    function openEmailComposeModal() {
        const { subject, body, to } = buildEmailContent();
        if (emailToIpt) emailToIpt.value = to;
        if (emailSubjectIpt) emailSubjectIpt.value = subject;
        if (emailBodyTxt) emailBodyTxt.value = body;
        if (emailComposeModal) {
            emailComposeModal.style.display = 'flex';
        }
    }

    function closeEmailComposeModal() {
        if (emailComposeModal) emailComposeModal.style.display = 'none';
    }

    if (shareCustomerEmailBtn) {
        shareCustomerEmailBtn.addEventListener('click', async () => {
            closeModal();
            // PDF 다운로드 먼저
            if (_pdfBlob && _pdfFileName) {
                downloadBlobFile(_pdfBlob, _pdfFileName);
                setTimeout(openEmailComposeModal, 600);
            } else {
                // PDF가 아직 생성 안된 경우 경고 없이 모달만 열기
                openEmailComposeModal();
            }
        });
    }

    if (closeEmailModal) closeEmailModal.addEventListener('click', closeEmailComposeModal);
    if (emailComposeModal) {
        emailComposeModal.addEventListener('click', (e) => {
            if (e.target === emailComposeModal) closeEmailComposeModal();
        });
    }

    // 본문 복사
    if (copyEmailBodyBtn) {
        copyEmailBodyBtn.addEventListener('click', () => {
            const text = emailBodyTxt?.value || '';
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => showToast('📋 본문이 클립보드에 복사되었습니다!'));
            } else {
                emailBodyTxt.select();
                document.execCommand('copy');
                showToast('📋 본문이 복사되었습니다!');
            }
        });
    }

    // 이메일 앱 열기
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', async () => {
            const format = document.querySelector('input[name="emailFormat"]:checked')?.value || 'html';
            const name = customerNameIpt?.value || '고객';

            if (format === 'pdf') {
                showToast('⏳ PDF 생성 중입니다...');
                const result = await buildPDFBlob(sendEmailBtn);
                if (result) {
                    downloadBlobFile(result.blob, result.fileName);
                    showToast('✅ PDF 다운로드 완료! 메일 앱이 열리면 파일을 첨부하세요.');
                }
            } else {
                // HTML 저장
                if (downloadHtmlBtnDetailed) {
                    downloadHtmlBtnDetailed.click();
                    showToast('✅ HTML 현황판 다운로드 완료! 메일 앱이 열리면 파일을 첨부하세요.');
                }
            }

            const to = encodeURIComponent(emailToIpt?.value || '');
            const subject = encodeURIComponent(emailSubjectIpt?.value || '');
            const body = encodeURIComponent(emailBodyTxt?.value || '');
            
            setTimeout(() => {
                window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
            }, 800);
            
            setTimeout(closeEmailComposeModal, 1500);
        });
    }

    // 포맷 선택에 따른 안내 문구 실시간 변경
    document.querySelectorAll('input[name="emailFormat"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const guide = document.getElementById('emailAttachmentGuide');
            if (guide) {
                if (e.target.value === 'pdf') {
                    guide.innerHTML = '<strong>PDF 견적서 자동 다운로드 후 첨부</strong><br>이메일 앱이 열리면 다운로드된 PDF 파일을 첨부해 주세요.';
                } else {
                    guide.innerHTML = '<strong>HTML 파일 자동 다운로드 후 첨부</strong><br>이메일 앱이 열리면 다운로드된 HTML 파일을 첨부해 주세요.';
                }
            }
        });
    });

    // 🔔 토스트 알림 헬퍼
    function showToast(message) {
        let toast = document.getElementById('hasnol-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'hasnol-toast';
            toast.style.cssText = 'position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:rgba(30,30,30,0.92); color:white; padding:14px 24px; border-radius:14px; font-size:0.88rem; font-weight:600; z-index:99999; max-width:88vw; text-align:center; line-height:1.5; box-shadow:0 8px 32px rgba(0,0,0,0.25); backdrop-filter:blur(8px); transition:opacity 0.3s;';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.display = 'block';
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => { toast.style.display = 'none'; }, 300); }, 3000);
    }

    // 📠 모바일 팩스
    document.getElementById('shareFaxBtn').addEventListener('click', () => {
        closeModal();
        if (!_pdfBlob || !_pdfFileName) return;
        downloadBlobFile(_pdfBlob, _pdfFileName);
        setTimeout(() => {
            alert('✅ PDF가 저장되었습니다.\n모바일 팩스 앱을 실행하여 저장된 파일을 전송해 주세요.');
        }, 800);
    });

    // 📤 스마트 기기 PDF 공유 버튼
    if (sharePdfBtn) {
        sharePdfBtn.addEventListener('click', async () => {
            const result = await buildPDFBlob(sharePdfBtn);
            if (!result) return;
            _pdfBlob = result.blob;
            _pdfFileName = result.fileName;
            openShareModal();
        });
    }

    // 🖨️ 문서 출력 및 저장 버튼
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', async () => {
            const result = await buildPDFBlob(downloadPdfBtn);
            if (!result) return;
            downloadBlobFile(result.blob, result.fileName);
        });
    }

    // --- HTML 저장 기능 (상세 견적 전용) ---
    const downloadHtmlBtnDetailed = document.getElementById('downloadHtmlBtnDetailed');
    if (downloadHtmlBtnDetailed) {
        downloadHtmlBtnDetailed.addEventListener('click', () => {
            const htmlContent = document.documentElement.outerHTML;
            const blob = new Blob(['<!DOCTYPE html>\n' + htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const name = customerNameIpt?.value || '고객';
            const filename = `HASNOL_견적서_${name}.html`;
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('💾 HTML 파일이 저장되었습니다.');
        });
    }

    // --- 이메일 발송 기능 (상세 견적 전용 - 저장 후 연동) ---
    const shareCustomerEmailBtnDetailed = document.getElementById('shareCustomerEmailBtnDetailed');
    if (shareCustomerEmailBtnDetailed) {
        shareCustomerEmailBtnDetailed.addEventListener('click', () => {
            // 이제 모달에서 다운로드 형식을 선택하므로 바로 모달만 열기
            openEmailComposeModal();
        });
    }

    // --- Supabase Cloud Storage Integration ---
    const SUPABASE_URL = 'https://vbrnzmakcthhaxktclnt.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_Ew2ZB1EqFa4eAITuxhoO5w_944IyA2F';
    
    // Initialize Supabase only if values are provided
    let supabaseClient = null;
    try {
        if (SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' && window.supabase) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
    } catch (e) {
        console.warn('Supabase 초기화 실패 (클라우드 저장 비활성):', e);
    }

    async function saveEstimateToCloud() {
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_PROJECT_URL') {
            alert('⚠️ Supabase 설정이 필요합니다.\napp.js 하단 코드에서 URL과 Anon Key를 입력해 주세요.\n(현재는 입력 대기 중입니다)');
            return;
        }

        const cloudBtn = document.getElementById('saveCloudBtn');
        const originalContent = cloudBtn.innerHTML;
        cloudBtn.innerHTML = '⏳';
        cloudBtn.disabled = true;

        try {
            const customerName = document.getElementById('customerName')?.value || '익명 고객';
            const customerPhone = document.getElementById('customerPhone')?.value || '';
            const customerApt = document.getElementById('customerApt')?.value || '';
            const customerSize = document.getElementById('customerSize')?.value || '';
            const customerScope = document.getElementById('customerScope')?.value || '';
            
            const qtyStr = document.getElementById('ba_qty')?.textContent || '0';
            const totalStr = document.getElementById('ba_total')?.textContent || '0';
            const totalQty = parseInt(qtyStr.replace(/[^0-9]/g, '')) || 0;
            const totalAmt = parseInt(totalStr.replace(/[^0-9]/g, '')) || 0;

            const { data, error } = await supabaseClient
                .from('estimates')
                .insert([
                    {
                        customer_name: customerName,
                        customer_phone: customerPhone,
                        apt_name: customerApt,
                        pyeong: customerSize,
                        scope: customerScope,
                        total_qty: totalQty,
                        total_amount: totalAmt,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;
            showToast('✅ 클라우드로 견적이 안전하게 전송되었습니다!');
        } catch (err) {
            console.error('Supabase Save Error:', err);
            alert('❌ 저장 실패: ' + err.message + '\n(대시보드에서 estimates 테이블과 컬럼이 생성되어 있는지 확인하세요)');
        } finally {
            if(cloudBtn) {
                cloudBtn.innerHTML = originalContent;
                cloudBtn.disabled = false;
            }
        }
    }

    document.getElementById('saveCloudBtn')?.addEventListener('click', saveEstimateToCloud);
});
