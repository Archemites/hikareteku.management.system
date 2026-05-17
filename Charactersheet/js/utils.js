/**
 * Hikareteku Scouter Utilities
 * Logic for Tier parsing, formatting, and extenso translation.
 */

const prefixosPersonalizados = [
    "Porri", "Caralh", "Sêmen", "Baz", "Gaz", "Krav", "Mleçuaqu", "Merda", "Fudida", "Netanyahu", "Cazaqu", "Nigga", "Tetra", "Vorthi", "Xantri", "Kravol", "Zyphri", "Dravoki", "Qorvexi", "Tharzul", "Nexari", "Velkrioni", "Zorvasti", "Kryzel", "Morvathi", "Xeltrazi", "Varnoki", "Threxi", "Golvari", "Zykrathi", "Vorquazi", "Draxol", "Kharveni", "Xornavi", "Trevaxi", "Zenthroki", "Morzavi", "Krythul", "Vexori", "Zalgrithi", "Tholvari", "Nexulthi", "Gravexi", "Xarnoki", "Velzorithi", "Drakvori", "Quenthari", "Zyloxi", "Vorzethi", "Krelvaxi", "Thyrgoni", "Xavrothi", "Morgravi", "Zelkrathi", "Vortheni", "Kryvoni", "Draxorithi", "Xanvoreli", "Threxovari", "Golzathi", "Nexorithi", "Varnexi", "Zyvorathi", "Kharzol", "Xelvorithi", "Morqeni", "Dravexori", "Tharnoki", "Velkravi", "Zorqathi", "Kryzolveni", "Vortraxi", "Xenthavori", "Gravorni", "Thalvexi", "Morzexari", "Zyphorathi", "Krenthul", "Xorvathi", "Veltrigoni", "Drakzorithi", "Nexvarothi", "Qorzavi", "Threxigoni", "Varnoktri", "Zelvorithi", "Kryphazori", "Xarnovexi", "Morgrathi", "Vorzenoki", "Draxavi", "Tholzexi", "Zykravori", "Krelthari", "Xavronexi", "Velzarki", "Morvexathi", "Threxulvori", "Gravokzi", "Xantravori", "Zorvenathi", "Krylthazori", "Nexogravi", "Vorthakzili", "Dravenoxi", "Xeltharvexi", "Morzoktri", "Zypharioni", "Qorvazenthi", "Thalgrivori", "Velkrathioni", "Xarnovarithi", "Zenthroxavi", "Bonga", "Tramba", "Flungo", "Xureba", "Zonko", "Blastro", "Pavora", "Gorbu", "Escalha", "Trombo", "Gronfa", "Zabru", "Clontra", "Vamblo", "Furdun", "Glumbo", "Charonfa", "Plastro", "Zambro", "Crungo", "Bulhastro", "Fanglo", "Dramblo", "Xontra", "Trulha", "Gorbla", "Flastron", "Morbega", "Jamblo", "Escatron", "Pambro", "Vlonka", "Grambola", "Chulgo", "Brastilha", "Trombega", "Xablon", "Frandula", "Gromba", "Clastrego", "Zorbulha", "Fangastra", "Trambega", "Plonko", "Escabron", "Vulgatra", "Drongla", "Bafunga", "Chumbra", "Grostilha", "Blongatra", "Xarbulha", "Crastomba", "Zunglo", "Trobunga", "Vastalha", "Glorbega", "Frungatra", "Morlonga", "Trastunga", "Bombastra", "Chalgro", "Escavunga", "Grombala", "Plastrunga", "Brongla", "Xurbonha", "Flambotra", "Crungastra", "Vlontraga", "Zambegra", "Trufalha", "Grumbola", "Jastromba", "Clungatra", "Fangombla", "Trobulha", "Morvangla", "Escabunga", "Drastrolha", "Plungatra", "Brastonga", "Chumbrega", "Xarlumba", "Frastunga", "Zorbangla", "Glastromba", "Vambulega", "Crongastra", "Flungobla", "Trombunga", "Grastrolha", "Escatronga", "Blungavra", "Morbulha", "Chastron", "Vrongala", "Plombega", "Xarfunga", "Trambolga"
];

const escalasPadrao = ["", "Mil", "Milhão", "Bilhão", "Trilhão", "Quadrilhão", "Quintilhão", "Sextilhão", "Septilhão", "Octilhão", "Nonilhão", "Decilhão"];

/**
 * Retorna o valor por extenso usando as escalas personalizadas do Hikareteku.
 */
function getExtensoCustom(num) {
    if (num < 1) return "Zero";
    let power = Math.floor(Math.log10(num) / 3);
    let valorBase = (num / Math.pow(1000, power)).toFixed(2).replace(".00", "");
    let plural = parseFloat(valorBase) > 1;

    let nomeEscala = "";
    if (power < escalasPadrao.length) {
        nomeEscala = escalasPadrao[power];
        if (plural && power > 1) nomeEscala = nomeEscala.replace("ão", "ões");
    } else {
        let customIndex = power - 12;
        if (customIndex < prefixosPersonalizados.length) {
            let prefixo = prefixosPersonalizados[customIndex];
            nomeEscala = prefixo + (plural ? "ilhões" : "ilhão");
        } else {
            nomeEscala = "Infinitilhão";
        }
    }
    return `${valorBase} ${nomeEscala}`;
}

/**
 * Converte uma string de Tier (ex: 100A, 1.5za) em um número real.
 */
function parseTier(input) {
    let clean = String(input).toLowerCase().trim();
    let letters = clean.match(/[a-z]+/);
    if (!letters) return parseFloat(clean) || 0;
    let val = parseFloat(clean.replace(letters[0], "")) || 0;
    let suffix = letters[0];
    let power = (suffix.length === 1) ? suffix.charCodeAt(0) - 96 : 26 + (suffix.charCodeAt(1) - 96);
    return val * Math.pow(1000, power);
}

/**
 * Converte um número real em uma string de Tier (ex: 1.5A).
 */
function formatTier(num) {
    if (num === 0) return "0";
    if (num < 1000) return Math.floor(num).toString();
    let power = Math.floor(Math.log10(num) / 3);
    let suffix = (power <= 26) ? String.fromCharCode(96 + power) : "z" + String.fromCharCode(96 + (power - 26));
    let base = (num / Math.pow(1000, power)).toFixed(2);
    return `${base.replace('.00', '')}${suffix}`;
}

/**
 * Calcula o modificador de um atributo (Base 10).
 */
function calculateMod(v) { 
    return Math.floor((v - 10) / 2); 
}
