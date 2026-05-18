# Hikareteku - Scouter Management System v7.1

Este é o sistema de Scanner e Cálculo de Dano otimizado para o RPG **Hikareteku**.

## 🚀 Otimizações Realizadas

- **Arquitetura Modular**: O código foi separado em camadas (HTML, CSS e JS) para facilitar a manutenção.
- **Prefixos Externos**: A lista massiva de prefixos foi movida para `js/data.js`.
- **Design Premium**: Interface revitalizada com estética Cyberpunk/Futurista, micro-animações e melhor legibilidade.
- **Lógica Refatorada**: Uso de módulos ES6 e limpeza de funções redundantes.
- **UX Melhorada**: Feedback visual instantâneo e organização semântica dos inputs.

## 📁 Estrutura do Projeto

```text
Hikareteku/
├── index.html        # Ponto de entrada (HTML limpo e semântico)
├── css/
│   └── style.css     # Estilização e Design System
└── js/
    ├── data.js       # Banco de dados de prefixos e nomes
    └── scouter.js    # Lógica central do simulador
```

## 🛠️ Como Usar

1. Abra o arquivo `index.html` em qualquer navegador moderno.
2. Insira o **PDL Atacante** (ex: `100A`, `5ZA`).
3. Defina a **Letra de Output** (tier do alvo).
4. Escolha o **Arquétipo** e clique em uma das **Ações de Combate**.
5. O log exibirá o cálculo detalhado, incluindo multiplicadores de potência e nomenclatura baseada em escala.

---
*Protocolo de Sincronização Management System ativado.*
