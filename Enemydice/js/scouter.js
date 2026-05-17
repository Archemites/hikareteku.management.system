(function() {
    let errosSeguidos = 0;
    let bonusSorte = 0;

    function log(msg) {
        const logDiv = document.getElementById('log');
        if (!logDiv) return;
        
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = msg;
        logDiv.prepend(entry);

    }

    function converterParaLetras(exp) {
        if (exp <= 0) return "";
        let countZ = Math.floor(exp / 26);
        let resto = exp % 26;
        let res = "";
        for (let i = 0; i < countZ; i++) res += "Z";
        if (resto > 0) res += String.fromCharCode(64 + resto);
        return res;
    }

    function formatarDanoFinal(valor, exp1000) {
        const { prefixos, nomesExtenso } = HIKARETEKU_DATA;
        
        while (valor >= 1000) {
            valor /= 1000;
            exp1000++;
        }

        let valorF = valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
        let letras = converterParaLetras(exp1000);
        let tagPotencia = `<span class="potencia-inline">(x1000<sup>${exp1000}</sup>)</span>`;

        // GUGOL (10^100 = 10 * 1000^33)
        if (exp1000 === 33 && Math.floor(valor) === 10) {
            return `<span class="gugol">1 GUGOL</span> ${tagPotencia} <span class="extenso">(${valorF}${letras})</span>`;
        }

        // PREFIXOS PERSONALIZADOS
        if (exp1000 >= 9 && exp1000 <= 200) {
            let prefixo = prefixos[(exp1000 - 9) % prefixos.length];
            let nomeIlhao = prefixo + "ilhão";
            if (valor >= 2) nomeIlhao = nomeIlhao.replace("ão", "ões");

            return `${valorF}${letras} ${tagPotencia} <span class="extenso">(${valorF} ${nomeIlhao})</span>`;
        }

        // EXTENSO PADRÃO
        if (exp1000 < 9) {
            let nome = nomesExtenso[exp1000];
            if (valor >= 2 && exp1000 > 1) nome = nome.replace("ão", "ões");
            return `${valorF}${letras} ${tagPotencia} <span class="extenso">${valorF}${nome}</span>`;
        }

        return `${valorF}${letras} ${tagPotencia}`;
    }

    function processarTurno(tipo, divisor, dfNivel) {
        const pdlInput = document.getElementById('pdl_input');
        const outputTierInput = document.getElementById('pdl_output_tier');
        const manualD20Input = document.getElementById('manual_d20');
        const manualModInput = document.getElementById('manual_mod');
        const arquetipoInput = document.getElementById('arquetipo');

        const pdlStr = pdlInput.value.toUpperCase().trim();
        const match = pdlStr.match(/^(\d+)([A-Z]*)$/);
        if (!match) {
            log('<span class="critico">ERRO: Formato de PDL inválido.</span>');
            return;
        }

        const valNominal = parseInt(match[1]);
        let expAtacante = 0;
        for (let i = 0; i < match[2].length; i++) {
            expAtacante += (match[2].charCodeAt(i) - 64);
        }

        const outputTierStr = outputTierInput.value.toUpperCase();
        let expOutput = 0;
        for (let i = 0; i < outputTierStr.length; i++) {
            expOutput += (outputTierStr.charCodeAt(i) - 64);
        }

        const d20Manual = manualD20Input.value;
        const modManual = parseInt(manualModInput.value) || 0;

        let dadoPuro = d20Manual === "" ? Math.floor(Math.random() * 20) + 1 : parseInt(d20Manual);
        let totalDado = dadoPuro + bonusSorte + modManual;
        const alvo = { 1: 5, 2: 10, 3: 14 }[dfNivel];

        log(`> SCAN: [${dadoPuro}] + Mod(${modManual}) + Sorte(${bonusSorte}) = <b>${totalDado}</b>`);

        if (totalDado > alvo || dadoPuro === 20) {
            const isCrit = (dadoPuro === 20);
            errosSeguidos = 0;
            bonusSorte = 0;
            
            const dDano = (tipo === 'forte' || tipo === 'ki') 
                ? (isCrit ? 20 : Math.random() * 20 + 1) 
                : (isCrit ? 10 : Math.random() * 10 + 1);

            let dano = dDano * (valNominal / divisor);
            const arq = arquetipoInput.value;
            
            if (tipo === 'ki') {
                dano *= (arq === 'longa' ? 1.5 : arq === 'equilibrado' ? 1.25 : 1);
            } else {
                dano *= (arq === 'curta' ? 1.5 : arq === 'equilibrado' ? 1.25 : 1);
            }

            let diff = expAtacante - expOutput;
            dano = dano * Math.pow(1000, diff);

            log(`>> <span class="${isCrit ? 'critico' : 'highlight'}">${isCrit ? 'CRÍTICO! ' : ''}DANO: ${formatarDanoFinal(dano, expOutput)}</span>`);
            manualD20Input.value = "";
        } else {
            errosSeguidos++;
            if (errosSeguidos % 3 === 0) bonusSorte++;
            log(`>> <span style="color:#666">ALVO EVADIU.</span>`);
            manualD20Input.value = "";
        }

        document.getElementById('luck_val').innerText = "+" + bonusSorte;
        document.getElementById('fail_val').innerText = errosSeguidos;
    }

    function limparLog() {
        const logDiv = document.getElementById('log');
        if (logDiv) logDiv.innerHTML = '<div class="log-entry">>> REBOOTING...</div>';
    }

    // Export to window
    window.processarTurno = processarTurno;
    window.limparLog = limparLog;
})();
