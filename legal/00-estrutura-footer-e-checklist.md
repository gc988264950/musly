# Estrutura de Footer e Checklist de Publicação

---

## 1. Estrutura de Links Recomendada no Footer

### Footer da Landing Page (público)

```
Coluna "Legal":
  - Termos de Uso
  - Política de Privacidade
  - Política de Cookies
  - Política de Uso Aceitável

Coluna "Suporte":
  - Política de Cancelamento e Reembolso
  - Propriedade Intelectual
  - Direitos LGPD / Privacidade  ← aponta para o Canal LGPD
```

### Footer dentro do App (usuário logado)

Rodapé discreto na parte inferior, linha única:

```
© 2025 Musly · Termos de Uso · Privacidade · Cookies · Cancelamento · LGPD
```

### Recomendação de URLs

| Documento | URL sugerida |
|---|---|
| Termos de Uso | `/termos-de-uso` |
| Política de Privacidade | `/privacidade` |
| Política de Cookies | `/cookies` |
| Cancelamento e Reembolso | `/cancelamento` |
| Uso Aceitável | `/uso-aceitavel` |
| Propriedade Intelectual | `/propriedade-intelectual` |
| Canal LGPD | `/lgpd` |

### Onde mais linkear

- **Página de cadastro (signup):** "Ao criar sua conta, você concorda com os [Termos de Uso] e a [Política de Privacidade]." — com checkboxes separados para marketing (opcional)
- **Checkout de plano pago:** link para [Política de Cancelamento e Reembolso]
- **Primeiro login:** banner ou modal de aceite de cookies com link para [Política de Cookies]
- **Assistente IA:** aviso discreto de que dados do estúdio são enviados à IA, com link para [Privacidade]

---

## 2. Checklist — Dados que Precisam ser Preenchidos Antes de Publicar

Substitua todos os placeholders abaixo em todos os documentos antes de publicar no site.

### 🔴 OBRIGATÓRIO — Sem esses dados, os documentos NÃO podem ser publicados

| Placeholder | O que é | Onde obter |
|---|---|---|
| `[RAZÃO SOCIAL]` | Nome jurídico completo da empresa | Registro na Junta Comercial ou cartório |
| `[CNPJ]` | Número do CNPJ | Receita Federal |
| `[ENDEREÇO COMPLETO]` | Endereço comercial completo (rua, número, complemento, cidade, estado, CEP) | Registro da empresa |
| `[E-MAIL DE CONTATO]` | E-mail de suporte ao usuário | Crie um e-mail dedicado, ex: `suporte@musly.com.br` |
| `[E-MAIL PARA LGPD]` | E-mail do Encarregado de Proteção de Dados (DPO) | Pode ser o mesmo de suporte ou um dedicado: `privacidade@musly.com.br` |
| `[DATA DE VIGÊNCIA]` | Data a partir da qual os documentos entram em vigor | Defina antes de publicar |
| `[CIDADE/ESTADO]` | Comarca para foro jurídico | Mesma cidade da sede da empresa |

### 🟡 IMPORTANTE — Preencha assim que possível

| Placeholder | O que é | Observação |
|---|---|---|
| `[NOME DO DPO]` | Nome do Encarregado de Proteção de Dados | Pode ser o próprio fundador/sócio enquanto pequena empresa; não precisa ser advogado |
| `[URL DE PLANOS]` | Link para a página de planos no site | Ex: `musly.com.br/planos` |
| `[LINK PARA TERMOS]` e outros links entre documentos | URLs dos documentos cruzados | Preencher após definir a estrutura de URLs do site |
| `[NOME DO GATEWAY — ex: Cakto]` | Nome do processador de pagamento atual | Confirmar se é Cakto ou outro |
| `[NOME DO RESPONSÁVEL TÉCNICO]` | Responsável pela segurança técnica (doc. 08) | Uso interno apenas |

### 🟢 PODE AGUARDAR

| Placeholder | O que é | Quando preencher |
|---|---|---|
| `[DATA]` (revisão interna) | Data da próxima revisão da política interna | Após publicar, definir ciclo de revisão |
| `[URL DE PLANOS]` | Link da página de planos | Quando o site estiver publicado |

---

## 3. Passos para Publicação

1. **Abra os documentos** de 01 a 07 e substitua todos os placeholders com os dados reais
2. **Revise com um advogado** — especialmente os Termos de Uso e a Política de Privacidade (recomendado antes de monetizar)
3. **Crie as páginas no site** — use as URLs sugeridas acima
4. **Adicione os links ao footer** da landing page e do app
5. **Implemente o banner de cookies** no primeiro acesso, com aceite para cookies não essenciais
6. **Adicione o checkbox de aceite** nos formulários de cadastro e checkout
7. **Configure o e-mail do Canal LGPD** para receber solicitações de titulares
8. **Teste os links** de todos os documentos entre si

---

## 4. Nota sobre Assessoria Jurídica

Estes documentos foram elaborados como base sólida e profissional, adaptada ao contexto específico da Musly SaaS, mas **não substituem a revisão por advogado especializado em direito digital e LGPD**. Recomenda-se especialmente:

- Revisão antes de atingir 500+ usuários ativos
- Revisão ao processar dados de menores em volume relevante
- Revisão ao expandir para outros países
- Revisão ao adicionar novos produtos ou modelos de negócio relevantes (ex: marketplace, contratos B2B com escolas)

O custo de uma revisão jurídica pontual é significativamente menor do que o custo de uma notificação da ANPD ou litígio com consumidor.
