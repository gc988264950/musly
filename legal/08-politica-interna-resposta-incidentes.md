# Política Interna de Resposta a Incidentes de Segurança

**Musly — Documento Interno**
**Classificação:** Uso Interno
**Última atualização:** [DATA DE VIGÊNCIA]
**Responsável:** [NOME DO RESPONSÁVEL TÉCNICO]

Este documento descreve o processo interno da Musly para identificar, conter, investigar e comunicar incidentes de segurança que possam afetar dados pessoais ou a operação da plataforma. Destina-se à equipe técnica e de gestão da empresa.

---

## 1. O que é um Incidente de Segurança?

Para fins desta política, um incidente de segurança é qualquer evento que resulte ou possa resultar em:

- Acesso não autorizado a dados pessoais de usuários (professores, alunos)
- Vazamento, alteração ou exclusão indevida de dados
- Comprometimento de credenciais de acesso à plataforma ou infraestrutura
- Indisponibilidade prolongada da plataforma (mais de 2 horas) por causa suspeita ou confirmada de ataque
- Exploração de vulnerabilidade de segurança

---

## 2. Responsabilidades

| Papel | Responsabilidade |
|---|---|
| **Responsável Técnico** | Coordena a resposta técnica, avalia impacto, aciona a equipe |
| **Responsável Legal/DPO** | Avalia obrigação de notificação (ANPD, usuários), coordena comunicação externa |
| **Gestão** | Decisões de negócio, comunicação com parceiros e clientes de alto impacto |

---

## 3. Processo de Resposta — 4 Fases

### Fase 1 — Identificação (0 a 2 horas)

**Objetivo:** Confirmar se houve incidente e qual a extensão.

Checklist:
- [ ] Identificar a origem do alerta (monitoramento, relato de usuário, terceiro)
- [ ] Classificar o incidente: **Baixo** / **Médio** / **Alto** / **Crítico**
- [ ] Registrar data, hora e descrição inicial em log de incidente
- [ ] Acionar o Responsável Técnico imediatamente (mesmo fora do horário comercial em casos Alto/Crítico)

**Critérios de classificação:**
- **Baixo:** falha técnica sem evidência de acesso indevido
- **Médio:** acesso suspeito, não confirmado, a dados não sensíveis
- **Alto:** acesso confirmado a dados pessoais de um ou poucos usuários
- **Crítico:** vazamento massivo de dados, comprometimento de infraestrutura, dados de menores afetados

### Fase 2 — Contenção (2 a 8 horas)

**Objetivo:** Limitar o dano imediato e estabilizar o sistema.

Ações possíveis conforme o tipo de incidente:
- [ ] Revogar tokens e sessões comprometidas via Supabase Admin
- [ ] Desabilitar temporariamente contas comprometidas
- [ ] Bloquear endereços IP maliciosos
- [ ] Desativar endpoint vulnerável (se houver) de forma controlada
- [ ] Fazer snapshot do estado do banco de dados para preservar evidências
- [ ] Notificar provedores afetados (Supabase, Vercel, OpenAI) conforme necessário

### Fase 3 — Investigação e Remediação (8 a 72 horas)

**Objetivo:** Entender a causa raiz e corrigir definitivamente.

Checklist:
- [ ] Analisar logs de acesso e eventos do período do incidente
- [ ] Identificar quais dados foram acessados/comprometidos (type, volume, titulares)
- [ ] Identificar a vulnerabilidade ou falha que possibilitou o incidente
- [ ] Implementar correção técnica e testar
- [ ] Documentar linha do tempo completa do incidente
- [ ] Avaliar se outros sistemas podem estar vulneráveis à mesma falha

### Fase 4 — Comunicação e Pós-Incidente

**Objetivo:** Cumprir obrigações legais e aprender com o incidente.

#### 4.1 Notificação à ANPD

Nos termos do art. 48 da LGPD, incidentes que **possam acarretar risco ou dano relevante** aos titulares devem ser comunicados à ANPD em prazo razoável (referência: 72 horas após ciência, conforme orientação da ANPD).

A comunicação deve incluir:
- Natureza dos dados pessoais afetados
- Informações sobre os titulares envolvidos
- Medidas técnicas e de segurança adotadas
- Riscos relacionados ao incidente
- Medidas adotadas para reverter ou mitigar os efeitos

Acesse o canal de comunicação da ANPD em: [gov.br/anpd](https://www.gov.br/anpd)

#### 4.2 Notificação aos Titulares

Se o incidente envolver risco real para os titulares (ex.: senha comprometida, dados expostos publicamente), notificar os usuários afetados por e-mail com:
- O que aconteceu (em linguagem clara e sem jargão técnico)
- Quais dados foram afetados
- O que já foi feito para protegê-los
- O que o usuário deve fazer (ex.: trocar senha, ficar alerta a comunicações suspeitas)
- Canal de contato para dúvidas

#### 4.3 Revisão Pós-Incidente

Após resolução, produzir relatório interno contendo:
- [ ] Linha do tempo detalhada
- [ ] Causa raiz identificada
- [ ] Ações de contenção e remediação tomadas
- [ ] Lições aprendidas
- [ ] Mudanças implementadas para prevenir recorrência
- [ ] Atualização do registro de incidentes

---

## 4. Registro de Incidentes

Todos os incidentes, independentemente da gravidade, devem ser documentados em registro interno (planilha ou ferramenta de gestão) contendo:

| Campo | Descrição |
|---|---|
| ID do incidente | Identificador único (ex: INC-2025-001) |
| Data/hora de detecção | |
| Data/hora de resolução | |
| Classificação | Baixo / Médio / Alto / Crítico |
| Tipo | Acesso indevido / Vazamento / Indisponibilidade / Outro |
| Dados afetados | Tipo e volume de dados |
| Titulares afetados | Quantos e quais perfis |
| Ações tomadas | Resumo das fases 1 a 4 |
| ANPD notificada? | Sim / Não / Não aplicável |
| Usuários notificados? | Sim / Não / Não aplicável |

---

## 5. Canal de Reporte para Terceiros

Pesquisadores de segurança ou usuários que identificarem vulnerabilidades podem reportá-las responsavelmente pelo e-mail:

**[E-MAIL DE CONTATO]** — Assunto: "Relatório de Segurança"

Comprometemo-nos a:
- Responder em até 5 dias úteis
- Não tomar ações legais contra pesquisadores que reportem de boa-fé
- Corrigir vulnerabilidades confirmadas com prioridade

---

## 6. Revisão desta Política

Esta política deve ser revisada:
- Anualmente
- Após qualquer incidente de segurança de nível Alto ou Crítico
- Após alterações relevantes na infraestrutura da plataforma

**Próxima revisão programada:** [DATA]
