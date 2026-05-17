/**
 * Hikareteku Character Sheet Logic
 * Handles UI, stats, and technique management.
 */

// Initialize components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    updateBars();
    updateMods();
    updateKiTheme();
    
    // Add default technique if list is empty
    if (document.getElementById('tech-list').children.length === 0) {
        addTech({
            name: "Soco Básico",
            type: "FIS",
            hasDamage: true,
            desc: "Um golpe físico padrão.",
            effect: "NONE"
        });
    }
});

/**
 * Rola dados e exibe no log da sidebar.
 */
function roll() {
    const qty = parseInt(document.getElementById('dice-qty').value) || 1;
    const type = parseInt(document.getElementById('dice-type').value);
    let sum = 0;
    for (let i = 0; i < qty; i++) sum += Math.floor(Math.random() * type) + 1;
    
    const log = document.getElementById('roll-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry-simple';
    entry.innerHTML = `<span class="log-scan-text">> SCAN: ${sum} [${qty}D${type}]</span>`;
    log.prepend(entry);
}

/**
 * Limpa o log de rolagens.
 */
function limparLog() {
    const log = document.getElementById('roll-log');
    log.innerHTML = `<div class="log-entry-simple">> SISTEMA REINICIADO...</div>`;
}

/**
 * Abre uma aba específica.
 */
function openTab(evt, tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
}

/**
 * Modifica um atributo de status (HP ou KI).
 */
function modStat(type, direction) {
    const currEl = document.getElementById(type + '-curr');
    const modEl = document.getElementById(type + '-mod');
    let currentVal = parseTier(currEl.value);
    let modVal = parseTier(modEl.value || 1);
    let newVal = currentVal + (modVal * direction);
    if (newVal < 0) newVal = 0;
    currEl.value = formatTier(newVal);
    updateBars();
}

/**
 * Atualiza visualmente as barras de status.
 */
function updateBars() {
    ['hp', 'ki'].forEach(stat => {
        const currEl = document.getElementById(stat + '-curr');
        const maxEl = document.getElementById(stat + '-max');
        const fill = document.getElementById(stat + '-bar-fill');
        const label = document.getElementById(stat + '-bar-label');
        if (!currEl || !maxEl || !fill || !label) return;
        
        const curr = parseTier(currEl.value);
        const max = parseTier(maxEl.value);
        let percent = (max > 0) ? (curr / max) * 100 : 0;
        if (percent > 100) percent = 100;
        
        fill.style.width = percent + '%';
        label.innerText = `${Math.floor(percent)}% (${formatTier(curr)})`;
    });
}

/**
 * Atualiza os modificadores de atributos baseados no valor atual.
 */
function updateMods() {
    ['STR', 'PER', 'END', 'CHA', 'INT', 'AGI', 'LUK'].forEach(id => {
        const el = document.getElementById('val-' + id);
        const modDisplay = document.getElementById('mod-' + id);
        if (el && modDisplay) {
            const m = calculateMod(parseInt(el.value) || 0);
            modDisplay.innerText = (m >= 0 ? '+' : '') + m;
        }
    });
}

/**
 * Salva uma nova técnica do formulário.
 */
function saveNewTech() {
    const nameEl = document.getElementById('form-name');
    const typeEl = document.getElementById('form-type');
    const damageEl = document.getElementById('form-has-damage');
    const descEl = document.getElementById('form-desc');
    const effectEl = document.getElementById('form-effect');

    const data = {
        name: nameEl.value || "TÉCNICA",
        type: typeEl.value,
        hasDamage: damageEl.checked,
        desc: descEl.value || "",
        effect: effectEl.value
    };
    
    addTech(data);
    
    // Reset form
    nameEl.value = "";
    descEl.value = "";
}

/**
 * Adiciona uma técnica ao arsenal visual (Grid).
 */
function addTech(data) {
    const list = document.getElementById('tech-list');
    if (!list) return;

    const card = document.createElement('div');
    card.className = 'tech-card';
    card.dataset.name = data.name;
    card.dataset.type = data.type;
    card.dataset.hasDamage = data.hasDamage;
    card.dataset.effect = data.effect;
    card.dataset.desc = data.desc;

    const effectNames = {
        "NONE": "NENHUM", "PIERCE": "PERFURAÇÃO", "EXPLODE": "EXPLOSÃO",
        "STUN": "PARALISIA", "TRACK": "RASTREADOR"
    };

    card.innerHTML = `
        <div class="tech-header">
            <strong class="tech-title">${data.name}</strong>
            <button class="btn-delete" onclick="this.closest('.tech-card').remove()">[X]</button>
        </div>
        
        <div class="tech-meta">
            <span>TIPO: ${data.type}</span>
            <span>DANO: ${data.hasDamage ? 'SIM' : 'NÃO'}</span>
        </div>

        <div class="tech-desc">
            ${data.desc || 'Sem descrição.'}
        </div>

        <div class="tech-effect-box">
            <label>EFEITO ATIVO</label>
            <div class="effect-val">${effectNames[data.effect]}</div>
        </div>

        <div class="calc-area">
            <div class="input-group-row">
                <label>DADO:</label>
                <input type="number" class="dice-result" value="15">
            </div>
            <div class="action-btns">
                <button class="btn-use" onclick="executeAttack(this)">USAR</button>
            </div>
        </div>`;
    list.prepend(card);
}

/**
 * Executa a lógica de ataque de uma técnica.
 */
function executeAttack(btn) {
    const card = btn.closest('.tech-card');
    const name = card.dataset.name;
    const desc = card.dataset.desc;
    const effect = card.dataset.effect;
    const type = card.dataset.type;
    const hasDamage = card.dataset.hasDamage === "true";

    const diceVal = parseInt(card.querySelector('.dice-result').value) || 0;
    const pdlReal = parseTier(document.getElementById('pdl-display').value);
    const attrKey = (type === 'KI') ? 'INT' : 'STR';
    const mod = calculateMod(parseInt(document.getElementById('val-' + attrKey).value) || 10);
    const rawDamage = (diceVal + mod) * (pdlReal / 95);

    const log = document.getElementById('roll-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry-damage';
    entry.dataset.type = type;

    let logContent = `<div class="log-header">>> ${name.toUpperCase()}</div>`;
    if (desc) logContent += `<div class="log-desc">${desc}</div>`;

    if (effect === "PIERCE") {
        logContent += `<div class="log-alert warning">MODO PERFURAÇÃO: Ignora 50% do Bloqueio.</div>`;
        if (hasDamage) logContent += `<span class="log-tier">${formatTier(rawDamage)} DANO</span>`;

        prepareChargeAction(card, btn, name, hasDamage, rawDamage);

    } else if (effect === "EXPLODE") {
        if (hasDamage) {
            logContent += `<span class="log-tier">${formatTier(rawDamage)} DANO DIRETO</span>`;
            logContent += `<span class="log-tier secondary">${formatTier(rawDamage * 0.25)} ONDA DE CHOQUE</span>`;
        }
        logContent += `<div class="log-alert info">Causa 25% do dano mesmo em esquiva.</div>`;
    } else if (effect === "STUN") {
        logContent += `<div class="log-alert ki">Role Teste de INT (2d20) para Atordoar!</div>`;
        if (hasDamage) logContent += `<span class="log-tier">${formatTier(rawDamage)} DANO</span>`;
    } else if (effect === "TRACK") {
        logContent += `<div class="log-alert tracking">SISTEMA RASTREADOR: Role com Vantagem.</div>`;
        prepareTrackingAction(card, btn, name, hasDamage, rawDamage);
    } else {
        if (hasDamage) logContent += `<span class="log-tier">${formatTier(rawDamage)} DANO</span>`;
    }

    if (hasDamage) logContent += `<span class="log-extenso">${getExtensoCustom(rawDamage)} de Dano Bruto</span>`;
    
    entry.innerHTML = logContent;
    log.prepend(entry);
}

/**
 * Prepara a ação de carga para técnicas de perfuração.
 */
function prepareChargeAction(card, btn, name, hasDamage, rawDamage) {
    btn.disabled = true;
    const actionArea = card.querySelector('.action-btns');
    
    const container = document.createElement('div');
    container.className = 'charge-container';
    container.innerHTML = `
        <input type="number" class="charge-turns" value="1" min="1">
        <button class="btn-charge">CARREGAR</button>
    `;

    container.querySelector('button').onclick = function() {
        const turns = parseInt(container.querySelector('.charge-turns').value) || 1;
        const isFull = turns > 1;
        
        const log = document.getElementById('roll-log');
        const entry = document.createElement('div');
        entry.className = 'log-entry-damage charge-result';
        
        entry.innerHTML = `
            <div class="log-header gold">>> ${name.toUpperCase()} (CARGA: ${turns}T)</div>
            <div class="log-alert gold">${isFull ? 'CARGA COMPLETA: 100% Ignore Bloqueio!' : 'CARGA PARCIAL: 50% Ignore Bloqueio.'}</div>
            ${hasDamage ? `<span class="log-tier">${formatTier(rawDamage)} DANO TOTAL</span>` : ''}
            ${hasDamage ? `<span class="log-extenso">${getExtensoCustom(rawDamage)}</span>` : ''}
        `;
        
        log.prepend(entry);
        btn.disabled = false;
        container.remove();
    };
    
    actionArea.appendChild(container);
}

/**
 * Prepara a ação de rastreamento.
 */
function prepareTrackingAction(card, btn, name, hasDamage, rawDamage) {
    btn.disabled = true;
    const actionArea = card.querySelector('.action-btns');
    
    const container = document.createElement('div');
    container.className = 'track-container';
    container.innerHTML = `
        <button class="btn-hit">🎯 ACERTO</button>
        <button class="btn-miss">💨 DESVIO</button>
    `;

    const log = document.getElementById('roll-log');

    container.querySelector('.btn-hit').onclick = () => {
        const entry = document.createElement('div');
        entry.className = 'log-entry-damage success';
        entry.innerHTML = `
            <div class="log-header success">>> ${name.toUpperCase()} (TRAVADO)</div>
            ${hasDamage ? `<span class="log-tier">${formatTier(rawDamage)} DANO</span>` : ''}
        `;
        log.prepend(entry);
        btn.disabled = false;
        container.remove();
    };

    container.querySelector('.btn-miss').onclick = () => {
        const entry = document.createElement('div');
        entry.className = 'log-entry-damage warning';
        entry.innerHTML = `
            <div class="log-header warning">>> ${name.toUpperCase()} (DESVIO)</div>
            <div class="log-desc">Sistema rastreador ativado para ataque extra (50% dano).</div>
            ${hasDamage ? `<span class="log-tier small">${formatTier(rawDamage * 0.5)} DANO</span>` : ''}
        `;
        log.prepend(entry);
        btn.disabled = false;
        container.remove();
    };
    
    actionArea.appendChild(container);
}

/**
 * Exporta todos os dados da ficha para um arquivo JSON.
 */
function exportToJson() {
    const data = {
        charName: document.getElementById('char-name').value,
        kiType: document.getElementById('ki-type-select').value,
        pdl: document.getElementById('pdl-display').value,
        attributes: {
            STR: document.getElementById('val-STR').value,
            PER: document.getElementById('val-PER').value,
            END: document.getElementById('val-END').value,
            CHA: document.getElementById('val-CHA').value,
            INT: document.getElementById('val-INT').value,
            AGI: document.getElementById('val-AGI').value,
            LUK: document.getElementById('val-LUK').value
        },
        stats: {
            hpCurr: document.getElementById('hp-curr').value,
            hpMax: document.getElementById('hp-max').value,
            kiCurr: document.getElementById('ki-curr').value,
            kiMax: document.getElementById('ki-max').value
        },
        zeni: document.getElementById('zeni-val').value,
        inventory: document.getElementById('inventory-val').value,
        notes: document.getElementById('notes-val').value,
        techniques: []
    };

    // Coletar técnicas
    document.querySelectorAll('.tech-card').forEach(card => {
        data.techniques.push({
            name: card.dataset.name,
            type: card.dataset.type,
            hasDamage: card.dataset.hasDamage === "true",
            desc: card.dataset.desc,
            effect: card.dataset.effect
        });
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ficha_${data.charName.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Importa dados de um arquivo JSON selecionado.
 */
function importFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Preencher campos básicos
            document.getElementById('char-name').value = data.charName || "";
            document.getElementById('ki-type-select').value = data.kiType || "normal";
            document.getElementById('pdl-display').value = data.pdl || "";
            
            // Atributos
            if (data.attributes) {
                Object.keys(data.attributes).forEach(attr => {
                    const el = document.getElementById('val-' + attr);
                    if (el) el.value = data.attributes[attr];
                });
            }
            
            // Status
            if (data.stats) {
                document.getElementById('hp-curr').value = data.stats.hpCurr;
                document.getElementById('hp-max').value = data.stats.hpMax;
                document.getElementById('ki-curr').value = data.stats.kiCurr;
                document.getElementById('ki-max').value = data.stats.kiMax;
            }
            
            document.getElementById('zeni-val').value = data.zeni || "";
            document.getElementById('inventory-val').value = data.inventory || "";
            document.getElementById('notes-val').value = data.notes || "";
            
            // Limpar técnicas atuais e carregar novas
            const list = document.getElementById('tech-list');
            list.innerHTML = "";
            if (data.techniques) {
                data.techniques.forEach(tech => addTech(tech));
            }
            
            // Atualizar UI
            updateBars();
            updateMods();
            updateKiTheme();
            
            const log = document.getElementById('roll-log');
            const entry = document.createElement('div');
            entry.className = 'log-entry-simple';
            entry.innerHTML = `<span style="color:var(--phosphor)">> DADOS CARREGADOS COM SUCESSO.</span>`;
            log.prepend(entry);
            
        } catch (err) {
            alert("Erro ao ler JSON: " + err.message);
        }
    };
    reader.readAsText(file);
}

/**
 * Atualiza o tema visual baseado no tipo de Ki.
 */
function updateKiTheme() {
    const type = document.getElementById('ki-type-select').value;
    const root = document.documentElement;
    
    const themes = {
        "normal": { color: "#00ffcc", glow: "0 0 10px rgba(0, 255, 204, 0.5)" },
        "maligno": { color: "#ff00ff", glow: "0 0 10px rgba(255, 0, 255, 0.5)" },
        "purificado": { color: "#ffffff", glow: "0 0 10px rgba(255, 255, 255, 0.5)" },
        "primitivo": { color: "#ff4400", glow: "0 0 10px rgba(255, 68, 0, 0.5)" }
    };
    
    const theme = themes[type] || themes.normal;
    root.style.setProperty('--ki-color', theme.color);
    
    // Atualizar log
    const log = document.getElementById('roll-log');
    if (log) {
        const entry = document.createElement('div');
        entry.className = 'log-entry-simple';
        entry.innerHTML = `<span style="color:${theme.color}">> SINTONIA DE KI: ${type.toUpperCase()}</span>`;
        log.prepend(entry);
    }
}

