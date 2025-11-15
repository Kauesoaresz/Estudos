# Kauê Study Tracker

Sistema web simples para **registrar e acompanhar a rotina de estudos**, focado em preparação para vestibulares/ENEM.  
Feito em Node.js + Express + EJS + MySQL, com ORM Sequelize.

> Projeto pessoal de estudo e organização criado por Leonardo (Kauê) para monitorar horas de estudo, questões resolvidas, simulados e qualidade do dia.

---

## ✨ Funcionalidades

- **Registro diário (Dia)**
  - Data
  - Hora que acordou / hora que dormiu
  - Horas totais de sono
  - Qualidade do sono (0–10)
  - Soneca (sim/não + minutos)
  - Horas líquidas de estudo
  - Questões feitas no dia
  - Questões acertadas no dia
  - Meta principal do dia + status (sim/não/parcial)
  - Nível de foco e energia (0–10)
  - Humor do dia (bom / ok / ruim)
  - Reflexões: erros do dia, o que melhorar, ponto alto, maior vacilo

- **Estudo por matéria**
  - Data
  - Matéria
  - Minutos estudados
  - Tipo de estudo (conteúdo novo, revisão, revisão de erro)
  - Tópicos estudados
  - Questões feitas, certas e marcadas para revisão

- **Simulados**
  - Data
  - Tempo total de prova (min)
  - Resumo do resultado
  - Área que mais errou
  - Principal dificuldade (tempo, cansaço, ansiedade, etc.)
  - Acertos por área:
    - Linguagens
    - Humanas
    - Naturezas
    - Matemática
  - Total de acertos do simulado

- **Históricos com ações**
  - Histórico de dias
  - Histórico de estudos por matéria
  - Histórico de simulados  
  Em todos é possível:
  - Ver detalhes
  - Editar
  - Excluir
  - Filtrar por período (e por matéria, no caso dos estudos)

- **Estatísticas**
  - **Estatísticas dos dias** (`/estatisticas/dias`)
    - Período: 7 dias, 30 dias ou todos
    - Total de dias e dias com estudo
    - Horas totais e média de horas/dia com estudo
    - Questões totais e média por dia
    - Média de horas de sono e qualidade do sono
    - Dias com soneca
    - Média de foco e energia
    - Distribuição de humor (bom / ok / ruim)
    - Gráficos com evolução (Chart.js)

  - **Estatísticas por matéria** (`/estatisticas/materias`)
    - Período: 7 dias, 30 dias ou todos
    - Horas totais por matéria
    - Questões totais e certas por matéria
    - Taxa de acerto por matéria
    - Número de dias estudados e número de blocos de estudo
    - Gráficos comparando matérias (horas x questões)

  - **Estatísticas de simulados** (`/estatisticas/simulados`)
    - Período: 7 dias, 30 dias ou todos
    - Total de simulados no período
    - Médias de acertos em:
      - Linguagens
      - Humanas
      - Naturezas
      - Matemática
    - Melhor e pior resultado (total de acertos)
    - Gráfico da evolução de acertos totais por simulado
    - Gráfico com média de acertos por área

- **Home como painel principal**
  - Resumo de:
    - **Hoje** (horas, questões, sono, foco, energia, humor)
    - **Últimos 7 dias**
    - **Últimos 30 dias**
  - Gráficos (últimos 30 dias):
    - Horas de estudo por dia
    - Questões resolvidas por dia
  - Ações rápidas:
    - Registrar dia
    - Registrar estudo por matéria
    - Registrar simulado
    - Ver estatísticas gerais

---

## 🧱 Tecnologias usadas

- **Backend:** Node.js + Express
- **View engine:** EJS
- **Banco de dados:** MySQL
- **ORM:** Sequelize
- **Estilização:** CSS puro (arquivo `public/css/style.css`)
- **Gráficos:** Chart.js (via CDN)

---

## 📁 Estrutura básica do projeto

```txt
Estudos/
  app.js
  package.json
  config/
    database.js
  models/
    index.js
    Dia.js
    Materia.js
    EstudoMateriaDia.js
    Simulado.js
  views/
    partials/
      header.ejs
      footer.ejs
    home.ejs
    dia_novo.ejs
    dias_lista.ejs
    dia_detalhe.ejs
    dia_editar.ejs
    materias_lista.ejs
    materia_detalhe.ejs
    materia_editar.ejs
    estudo_materia_novo.ejs
    estudos_lista.ejs
    estudo_materia_detalhe.ejs
    estudo_materia_editar.ejs
    simulado_novo.ejs
    simulados_lista.ejs
    simulado_detalhe.ejs
    simulado_editar.ejs
    estatisticas_dias.ejs
    estatisticas_materias.ejs
    estatisticas_simulados.ejs
  public/
    css/
      style.css
    js/
      (se necessário futuramente)
