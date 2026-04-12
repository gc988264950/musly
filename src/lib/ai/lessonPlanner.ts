/**
 * Local AI lesson plan generator.
 *
 * Produces structured, pedagogically sound lesson plans based on the student's
 * profile. All logic is self-contained — no external API calls.
 *
 * TODO (AI): Replace `generateLessonPlan` with an OpenAI / Anthropic call,
 * keeping the same `PlanInput` → `GeneratedOutput` contract.
 */

import type { LessonFocus, LessonPlanSection, StudentLevel } from '@/lib/db/types'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface PlanInput {
  instrument: string
  duration: 30 | 45 | 60
  focus: LessonFocus
  level: StudentLevel
  difficulties: string[]       // from student progress
  objectives: string           // from student profile
  teacherObservation: string
  teachingMethod?: string      // from teacher settings — injected into summary/activities
  repertoireTitles?: string[]  // active repertoire items
}

export interface GeneratedOutput {
  title: string
  summary: string
  sections: LessonPlanSection[]
}

// ─── Instrument normalisation ─────────────────────────────────────────────────

type InstrCat =
  | 'teclado'      // Piano, Teclado, Órgão
  | 'corda_ded'    // Violão, Guitarra, Cavaquinho, Ukulele
  | 'corda_fric'   // Violino, Viola, Violoncelo
  | 'voz'          // Canto
  | 'percussao'    // Bateria, Percussão
  | 'sopro'        // Flauta, Saxofone, Clarinete, Trompete, Trombone
  | 'baixo'        // Contrabaixo, Baixo
  | 'geral'

function categorize(instrument: string): InstrCat {
  const s = instrument
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (/piano|teclado|orgao/.test(s)) return 'teclado'
  if (/violao|guitarra|cavaquinho|ukulele/.test(s)) return 'corda_ded'
  if (/violino|viola da gamba|violoncelo|cello/.test(s)) return 'corda_fric'
  if (/canto|voz|vocal/.test(s)) return 'voz'
  if (/bateria|percuss/.test(s)) return 'percussao'
  if (/baixo|contrabaixo/.test(s)) return 'baixo'
  if (/flauta|saxofone|clarinete|trompete|trombone|tuba|oboe|fagote/.test(s)) return 'sopro'
  return 'geral'
}

// ─── Time allocation table ────────────────────────────────────────────────────
// [aquecimento, tecnica, pratica, revisao, tarefa]

const TIME: Record<LessonFocus, Record<30 | 45 | 60, [number, number, number, number, number]>> = {
  misto:        { 30: [5,  8, 10,  5, 2], 45: [7, 12, 15,  8, 3], 60: [10, 15, 22, 10, 3] },
  tecnica:      { 30: [5, 13,  7,  4, 1], 45: [7, 20, 10,  6, 2], 60: [10, 25, 15,  8, 2] },
  repertorio:   { 30: [4,  5, 15,  4, 2], 45: [5,  8, 22,  7, 3], 60: [7,  10, 30,  8, 5] },
  teoria:       { 30: [3,  5, 10, 10, 2], 45: [4,  8, 15, 15, 3], 60: [5,  10, 20, 20, 5] },
  improvisacao: { 30: [5,  8, 12,  4, 1], 45: [7, 12, 18,  6, 2], 60: [10, 15, 25,  7, 3] },
  leitura:      { 30: [4,  6, 13,  5, 2], 45: [5, 10, 19,  8, 3], 60: [7,  12, 25, 12, 4] },
  ritmo:        { 30: [5, 10, 10,  4, 1], 45: [7, 15, 15,  6, 2], 60: [10, 20, 20,  8, 2] },
}

// ─── Difficulty helper ────────────────────────────────────────────────────────

function hasDiff(difficulties: string[], keywords: string[]): boolean {
  const joined = difficulties.join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return keywords.some((k) => joined.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
}

function hasObj(objectives: string, keywords: string[]): boolean {
  const s = objectives.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return keywords.some((k) => s.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
}

// ─── BPM helper (adapt to level) ─────────────────────────────────────────────

function bpm(cat: 'slow' | 'medium' | 'fast', level: StudentLevel): string {
  const map: Record<typeof cat, Record<StudentLevel, string>> = {
    slow:   { Iniciante: '♩= 50–60', Intermediário: '♩= 60–72', Avançado: '♩= 72–84' },
    medium: { Iniciante: '♩= 60–72', Intermediário: '♩= 80–96', Avançado: '♩= 100–116' },
    fast:   { Iniciante: '♩= 80–88', Intermediário: '♩= 100–112', Avançado: '♩= 120–144' },
  }
  return map[cat][level]
}

// ─── Content library ──────────────────────────────────────────────────────────

// Each returns an array of activity strings; caller trims to desired count.

function warmupActivities(cat: InstrCat, level: StudentLevel): string[] {
  const map: Record<InstrCat, Record<StudentLevel, string[]>> = {
    teclado: {
      Iniciante: [
        'Soltar os pulsos: sacudir as mãos 30 segundos e relaxar os ombros',
        'Verificar postura: costas eretas, cotovelos alinhados com o teclado, pés apoiados',
        `Escala de Dó maior com a mão direita (${bpm('slow', level)}), dedilhado 1-2-3-1-2-3-4-5`,
        'Exercício de posição: segurar a posição de arco com os 5 dedos em Dó por 10 segundos',
      ],
      Intermediário: [
        `Hanon nº 1: padrão 1-2-3-4-5-4-3-2 subindo cromaticamente (${bpm('medium', level)})`,
        `Escalas de Sol e Ré maior em movimento paralelo com as duas mãos (${bpm('medium', level)})`,
        'Arpejos de tríades: Dó, Sol, Fá maior e relativas menores (mãos alternadas)',
        'Exercício de trillo rápido: alternância 2-3 em todas as tonalidades',
      ],
      Avançado: [
        `Hanon exercícios 1-3 em tempo progressivo: ♩= 100 → 120 (subir 4 BPM a cada repetição)`,
        'Escalas em terças paralelas e sextas em Dó e Sol maior',
        'Exercício de independência: mão esquerda legato sustentado, mão direita staccato simultâneo',
        'Arpejos quebrados em 4 oitavas com dedilhado rigoroso e braço relaxado',
      ],
    },
    corda_ded: {
      Iniciante: [
        'Soltar os dedos: abrir e fechar as mãos devagar, 5 repetições',
        'Verificar postura: posição do polegar, curvatura dos dedos e ângulo do pulso',
        'Spider exercise: dedos 1-2-3-4 subindo e descendo nas 6 cordas (lento, notas claras)',
        'Troca de acordes Am → G → C (4 batidas cada, metrônomo desligado)',
      ],
      Intermediário: [
        `Ligados ascendentes e descendentes em uma corda: Mi→Fá→Sol→Lá (${bpm('medium', level)})`,
        `Escala pentatônica em Lá menor percorrendo o braço — subida e descida (${bpm('medium', level)})`,
        `Palheta alternada em escala cromática, notas uniformes e atacadas (${bpm('medium', level)})`,
        'Troca rápida entre acordes com cejilha: Am7→G→Cadd9→Fadd9',
      ],
      Avançado: [
        `Escala maior em 3 oitavas com palheta alternada (${bpm('fast', level)})`,
        `Legato: frases de 16 notas em escala diatônica, foco em uniformidade de dinâmica (${bpm('medium', level)})`,
        'Arpejo em varredura (sweep) sobre tríades maiores e menores nos 5 shapes do CAGED',
        'Tapping: exercício de 3 dedos alternando posições na corda Sol',
      ],
    },
    corda_fric: {
      Iniciante: [
        'Verificar postura: violino no queixo com apoio do queixeiro, cotovelo esquerdo avançado',
        'Notas longas em cordas soltas: Ré e Lá (arco inteiro, pp → ff → pp)',
        `Escala de Ré maior em 1ª posição, notas separadas (${bpm('slow', level)})`,
        'Exercício de pressão do arco: perceber diferença entre pp, mp e f',
      ],
      Intermediário: [
        `Escala de Ré maior em 2 oitavas: détaché e legato (${bpm('medium', level)})`,
        'Exercícios de golpes de arco: martelé, spiccato básico e legato em escala de Sol',
        `Mudança de posição: 1ª → 2ª → 3ª posição em Lá maior (${bpm('slow', level)})`,
        'Exercício de afinação: tocar junto com drone de Lá (440 Hz) e ajustar',
      ],
      Avançado: [
        `Escala de Lá maior em 3 oitavas com variações de arco: détaché, legato, spiccato (${bpm('fast', level)})`,
        'Duplas cordas: terças e sextas em escala de Ré maior',
        'Exercício de vibrato: sequência de ritmos — semínima, colcheia, tercina, semicolcheia',
        'Escalas em harmônicos: naturais e artificiais na corda Lá',
      ],
    },
    voz: {
      Iniciante: [
        'Respiração: inspire 4 tempos (diafragma), expire 8 tempos soprando devagar (3 vezes)',
        'Relaxamento: rolar a cabeça, soltar os ombros, bocejar com a boca aberta',
        "Vocalize em 'mmmm' subindo meio tom por vez de Dó3 ao Sol3",
        "Articulação: 'ma-me-mi-mo-mu' em notas longas, boca bem aberta no 'a'",
      ],
      Intermediário: [
        "Vocalises em legato: escala de Dó até Sol (ida e volta) em 'a-e-i-o-u'",
        'Exercício de apoio: notas longas com crescendo e decrescendo (messa di voce)',
        "Arpejos de tríade em staccato: 'ya-ya-ya-ya-ya' (clareza de cada nota)",
        "Vocalize de passagem: escala cromática na região de passagem (passaggio)",
      ],
      Avançado: [
        "Vocalises técnicos: Marchesi op. 1 nº 1 ou equivalente em andamento vivo",
        "Exercício de coloratura: escala rápida em 'a' de Dó4 ao Dó6 (soprano) ou equivalente",
        'Exercício de registro: alternância controlada entre voz de peito e cabeça (voix mixte)',
        "Resonância: 'ng-ng-ng' nas notas agudas para colocar o som na máscara",
      ],
    },
    percussao: {
      Iniciante: [
        'Verificar postura: cotovelos a 90°, baquetas em ângulo de 45°, pulsos relaxados',
        "Rudimento single stroke roll: R-L-R-L por 1 minuto (${bpm('slow', level)})",
        'Exercício de bumbo: 4 batidas por compasso com pé direito (sem as mãos)',
        'Batida básica de rock: bumbo no 1 e 3, caixa no 2 e 4, hi-hat constante',
      ],
      Intermediário: [
        `Rudimentos: paradiddle (RLRR LRLL) e double stroke roll (${bpm('medium', level)})`,
        'Groove de rock com variação de bumbo: adicionar nota de bumbo no "e" do 2º tempo',
        'Hi-hat: padrão de abertura e fechamento em diferentes subdivisões (colcheia e tercina)',
        'Fill de 1 compasso: semicolcheias passando por caixa, tons e prato de choque',
      ],
      Avançado: [
        `Rudimentos avançados: flamacue, ratamacue e Swiss Army triplet (${bpm('fast', level)})`,
        'Poliritmia: 3 contra 4 (mãos fazem 3, pé faz 4, depois inverter)',
        'Exercício de independência: padrão de jazz (ride + hi-hat de pé) com variações de caixa e bumbo',
        'Leitura à primeira vista: compasso de 5/4 com fill em cada bar',
      ],
    },
    sopro: {
      Iniciante: [
        'Respiração e embocadura: soprar no bocal (saxofone/trompete) ou cabeça (flauta) produzindo som limpo',
        'Notas longas: Ré, Mi, Fá (4 tempos cada), foco em emissão estável sem vibrato',
        `Escala de Dó maior (1 oitava), notas separadas (${bpm('slow', level)})`,
        'Exercício de dinâmica: tocar nota Lá de pp a ff e de volta (4 tempos crescendo, 4 decrescendo)',
      ],
      Intermediário: [
        `Escalas de Sol e Ré maior com articulação legato e staccato (${bpm('medium', level)})`,
        "Exercício de tonguing: 'tu-tu-tu' em escala cromática, uniformidade das notas",
        'Notas longas com vibrato controlado (flauta/saxofone): 2 oscilações por tempo',
        `Arpejos de tríades maiores e menores (${bpm('medium', level)})`,
      ],
      Avançado: [
        `Escalas em 2 oitavas com combinações de articulação: legato-staccato, 3-1, 2-2 (${bpm('fast', level)})`,
        'Exercício de trinados: meio tom acima em toda a extensão do instrumento',
        'Harmônicos e flageolets (flauta) ou superação de registro (saxofone): oitava alta com digitação básica',
        `Escalas em modos Jônio, Dórico e Mixolídio (${bpm('fast', level)})`,
      ],
    },
    baixo: {
      Iniciante: [
        'Verificar postura: pulso da mão esquerda relaxado, dedos curvados, polegar atrás do braço',
        'Exercício de dedos: 1-2-3-4 nas 4 cordas em notas sustentadas',
        `Escala de Dó maior (1 oitava) em cordas separadas, dedilhado 2-4 (${bpm('slow', level)})`,
        'Padrão de root note: tocar a tônica do acorde em progressão Am→G→C→F',
      ],
      Intermediário: [
        `Escala de Dó maior em 2 oitavas alternando dedilhado (${bpm('medium', level)})`,
        `Walking bass: progressão I-IV-V-I em Dó maior, semínimas (${bpm('medium', level)})`,
        'Slap básico: alternância polegar (T) e dedo indicador (P) em padrão regular',
        `Padrão de oitavas em progressão de acordes (${bpm('medium', level)})`,
      ],
      Avançado: [
        `Escalas em 3 oitavas com 4 dedos alternados (${bpm('fast', level)})`,
        'Técnica de slap avançado: double thumbing e pluck em frases de funk',
        `Walking bass jazz: interpolação de notas de passagem em ii-V-I (${bpm('medium', level)})`,
        'Exercício de harmônicos naturais nas 4 cordas',
      ],
    },
    geral: {
      Iniciante: [
        'Exercícios de postura e posicionamento do instrumento',
        `Notas longas para aquecimento: 4 tempos por nota (${bpm('slow', level)})`,
        `Escala de Dó maior em tempo lento (${bpm('slow', level)})`,
        'Verificar afinação do instrumento',
      ],
      Intermediário: [
        `Escalas maiores e menores principais em tempo moderado (${bpm('medium', level)})`,
        'Arpejos de tríades maiores e menores',
        `Exercícios de articulação: legato e staccato na mesma frase (${bpm('medium', level)})`,
      ],
      Avançado: [
        `Escalas em modos: Dórico, Mixolídio, Lídio (${bpm('fast', level)})`,
        `Exercícios de velocidade em escala com semicolcheias (${bpm('fast', level)})`,
        'Frases musicais completas com expressão e dinâmica variada',
        'Exercício de improvisação livre sobre um drone de Lá',
      ],
    },
  }
  return map[cat][level]
}

function techniqueActivities(
  cat: InstrCat,
  level: StudentLevel,
  focus: LessonFocus,
  difficulties: string[],
  objectives: string,
): string[] {
  const base: Record<InstrCat, Record<StudentLevel, string[]>> = {
    teclado: {
      Iniciante: [
        `Estudo de dedilhado: Czerny op. 599 nº 1 ou equivalente (${bpm('slow', level)})`,
        'Praticar a mão esquerda separadamente: padrão de acompanhamento básico',
        'Trabalhar lentamente trecho difícil: 4 compassos com mão direita, depois mão esquerda, depois juntas',
      ],
      Intermediário: [
        `Velocidade progressiva: começar em ${bpm('slow', level)}, aumentar 4 BPM a cada 3 execuções corretas`,
        'Articulação contrastante: tocar frase em legato, depois staccato, perceber diferença de caráter',
        'Escala de Lá menor harmônica e melódica (subida com #7, descida natural)',
        'Trabalho de pedal: usar o pedal com precisão harmônica (trocar a cada mudança de acorde)',
      ],
      Avançado: [
        'Polifonia: tocar voz do soprano destacada, depois base, depois integrar (Bach ou equivalente)',
        'Ritmo pontuado: trabalhar passagem difícil com ritmo alternado (longa-curta, curta-longa)',
        'Micro-técnica: isolar célula rítmica problemática e repetir 10x em tempo lento antes de acelerar',
        'Independência de dinâmica: mão esquerda f, mão direita p (depois inverter)',
      ],
    },
    corda_ded: {
      Iniciante: [
        `Estudo de dedilhado: escala cromática com dedos 1-2-3-4 no braço (${bpm('slow', level)})`,
        'Praticar troca de acordes difícil 20 vezes seguidas sem pausa',
        'Exercício de precisão: tocar uma nota por vez e verificar que cada corda soa limpa',
      ],
      Intermediário: [
        `Velocidade em legato: frase de 4 notas, repetir subindo semitom a semitom (${bpm('medium', level)})`,
        'Ditado melódico: o professor toca uma frase curta, aluno reproduz de ouvido',
        'Exercício de bending: subir 1 tom com vibrato sustentado por 4 tempos',
        'Sobreposição: tocar melodia e baixo simultaneamente (fingerstyle básico)',
      ],
      Avançado: [
        `Velocidade máxima: passagem escolhida a 60% do alvo, subir 5 BPM até chegar ao alvo (${bpm('fast', level)})`,
        'Economy picking: comparar com alternate picking na mesma frase',
        'Hibridização: combinar palheta e dedos (hybrid picking) em arpejo',
        'Exercício de dois braços: mão esquerda faz legato longo, mão direita faz picking preciso',
      ],
    },
    corda_fric: {
      Iniciante: [
        `Exercício de arco: détaché controlado em uma corda solta, 8 batidas por arco (${bpm('slow', level)})`,
        'Praticar notas com dedo pressionando completamente — verificar que não abafa cordas vizinhas',
        `Escala com nota repetida: Ré-Ré-Mi-Mi-Fá-Fá… (${bpm('slow', level)})`,
      ],
      Intermediário: [
        `Golpes de arco: détaché, legato (4 notas por arco) e martelé na mesma escala (${bpm('medium', level)})`,
        'Exercício de afinação: escala em uníssono com a professora (ou gravação) percebendo batimento',
        'Mudança de posição com guia: deslizar com o 1º dedo como guia, depois adicionar os outros',
      ],
      Avançado: [
        'Spiccato controlado: encontrar o ponto de equilíbrio do arco e desenvolver saltello',
        `Duplas cordas em terças: subir e descer escala de Ré maior em terças (${bpm('medium', level)})`,
        'Exercício de vibrato: aplicar em cada nota de frase musical com continuidade',
        'Col legno e sul tasto: explorar timbres extremos como exercício de controle de arco',
      ],
    },
    voz: {
      Iniciante: [
        "Entonação: cantar nota (ex. Lá3) com o professor ao piano, verificar se está afinado",
        "Exercício de projeção: cantar 'a' em crescendo sem forçar a garganta",
        "Dicção: ler texto da música em ritmo, depois cantar sem melodia, depois com melodia",
      ],
      Intermediário: [
        'Passaggio: exercício específico para a região de transição de registro (escalas cromáticas lentas)',
        "Legato vocal: ligar as vogais sem interrupção de consoantes — 'l'amore è bello'",
        "Dinâmica: cantar frase com p, mp, mf, f — identificar qual é mais natural e trabalhar os extremos",
      ],
      Avançado: [
        'Coloratura: frases de semicolcheias em vocalise, clareza em cada nota mesmo em velocidade',
        'Messa di voce em notas difíceis: a nota mais desafiadora do repertório, p → f → p',
        "Recitativo: inflexão dramática, entonação de texto sem melodia regular",
      ],
    },
    percussao: {
      Iniciante: [
        `Contagem em voz alta: tocar caixa contando "1 e 2 e 3 e 4 e" em voz alta (${bpm('slow', level)})`,
        'Coordenação básica: mãos e bumbo juntos no tempo forte, sem hi-hat',
        'Exercício de dinâmica: suave (p) e forte (f) na mesma sequência rítmica',
      ],
      Intermediário: [
        `Groove de funk: colcheia no hi-hat, caixa no 2 e 4, bumbo em padrão sincopado (${bpm('medium', level)})`,
        'Independência: manter o hi-hat constante enquanto caixa e bumbo fazem padrão variado',
        'Exercício de dinâmica de hi-hat: variação de abertura (aberto/fechado) no mesmo groove',
      ],
      Avançado: [
        `Groove de jazz: ride em padrão swing (longa-curta-curta), hi-hat no 2 e 4 (${bpm('medium', level)})`,
        'Poliritmia 2 sobre 3: mão direita faz divisão binária, esquerda ternária',
        'Exercício de controle de dinâmica: tocar o mesmo groove de pp a ff em 8 compassos',
      ],
    },
    sopro: {
      Iniciante: [
        `Slurring: ligar 4 notas da escala em uma única expiração (${bpm('slow', level)})`,
        "Exercício de tonguing: 'tu' isolado em cada nota, ataque limpo sem estalo",
        "Dinâmica: tocar mesma nota de p a f e de volta, controlar o ar sem mudar embocadura",
      ],
      Intermediário: [
        `Articulação mista: legato-staccato-legato em frase de 8 notas (${bpm('medium', level)})`,
        'Exercício de respiração circular básica (flauta/sopro): manutenção do fluxo',
        `Intervalos: tocar 3ª, 5ª e oitava a partir de cada nota da escala de Dó (${bpm('medium', level)})`,
      ],
      Avançado: [
        `Frullato (flauta) ou slap tongue (sax): incorporar efeito em frase musical (${bpm('medium', level)})`,
        'Multifônicos básicos: 2-3 multifônicos controlados com qualidade de som aceitável',
        `Velocidade em articulação dupla (trompete/flauta): 'tu-ku-tu-ku' (${bpm('fast', level)})`,
      ],
    },
    baixo: {
      Iniciante: [
        `Exercício de precisão: tocar 4 notas e verificar que cada uma soa limpa, sem zumbido (${bpm('slow', level)})`,
        'Ritmo de colcheia: manter pulsação estável em notas longas enquanto conta',
        'Root + quinta: tocar raiz e quinta de cada acorde em progressão Am→G→C→F',
      ],
      Intermediário: [
        `Walking bass em 4 notas por compasso: I-IV-V-I (${bpm('medium', level)})`,
        'Exercício de groove: manter groove de rock sólido enquanto improvisa variação melódica',
        `Slap: padrão T-P-T-P em notas Dó e Fá alternadas (${bpm('medium', level)})`,
      ],
      Avançado: [
        `Walking jazz com interpolação cromática: ii-V-I em todas as tonalidades (${bpm('medium', level)})`,
        'Exercício de sobretons: tocar harmônico natural e artificial na mesma posição',
        'Groove de funk avançado: ghost notes na caixa de bateria imaginária (notas muito suaves)',
      ],
    },
    geral: {
      Iniciante: [
        `Exercício de dedilhado em escala lenta (${bpm('slow', level)})`,
        'Praticar trecho difícil mão por mão (ou parte por parte)',
        'Verificar dinâmica: tocar de forma expressiva, não mecânica',
      ],
      Intermediário: [
        `Velocidade progressiva: começa lento, aumenta 4 BPM a cada execução correta (${bpm('slow', level)} → ${bpm('medium', level)})`,
        'Articulação: comparar legato e staccato no mesmo trecho',
        'Trabalho de detalhe: escolher o compasso mais difícil e praticar 10x seguidas',
      ],
      Avançado: [
        `Exercício de velocidade com micro-técnica (${bpm('fast', level)})`,
        'Expressão: tocar trecho com 3 interpretações diferentes (alegre, dramático, lírico)',
        'Análise em prática: identificar estrutura harmônica e usar para guiar a interpretação',
      ],
    },
  }

  const activities = [...(base[cat][level] ?? [])]

  // Inject difficulty-targeted activities
  if (hasDiff(difficulties, ['ritmo', 'ritmica', 'pulsacao', 'tempo'])) {
    activities.unshift(`Trabalhar trecho com metrônomo em subdivisão de colcheia (${bpm('slow', level)} → ${bpm('medium', level)})`)
  }
  if (hasDiff(difficulties, ['leitura', 'partitura', 'solfejo', 'cifra'])) {
    activities.push('Leitura à primeira vista: ler 4 compassos novos sem parar, mesmo com erros')
  }
  if (hasDiff(difficulties, ['afinacao', 'afinação', 'entonacao', 'desafino'])) {
    activities.push('Exercício de afinação: tocar junto com drone de 440 Hz e ajustar a emissão')
  }
  if (hasDiff(difficulties, ['postura', 'tensao', 'tensão', 'dor'])) {
    activities.unshift('Check de postura: verificar tensão em ombros, pulso e pescoço antes de começar')
  }
  if (hasDiff(difficulties, ['coordenacao', 'coordenação', 'independencia', 'independência'])) {
    activities.push('Exercício de independência: praticar cada mão/parte separadamente antes de juntar')
  }

  // Inject objective-aligned activity
  if (hasObj(objectives, ['improvisa', 'improvisar', 'criativo', 'criar'])) {
    activities.push('Improvisação guiada: improvisar 4 compassos sobre escala trabalhada no aquecimento')
  }

  return activities
}

function practiceActivities(
  cat: InstrCat,
  level: StudentLevel,
  focus: LessonFocus,
  objectives: string,
  repertoire: string[],
): string[] {
  const hasRepertoire = repertoire.length > 0
  const piece1 = hasRepertoire ? repertoire[0] : null
  const piece2 = hasRepertoire && repertoire.length > 1 ? repertoire[1] : null

  const focusLabel: Record<LessonFocus, string> = {
    misto: 'trabalho equilibrado de técnica e música',
    tecnica: 'aplicação da técnica em contexto musical',
    repertorio: 'polimento do repertório em andamento',
    teoria: 'aplicação da teoria em exercícios práticos',
    improvisacao: 'desenvolvimento da criatividade musical',
    leitura: 'leitura e interpretação de texto musical',
    ritmo: 'solidez rítmica em contexto musical',
  }

  const activities: string[] = []

  // Focus-specific practice
  if (focus === 'teoria') {
    activities.push(
      'Identificar a tonalidade e os graus do acorde na música trabalhada',
      'Escrever ou cantar a escala correspondente à tonalidade da música',
      'Exercício de reconhecimento de intervalos: o professor toca, aluno nomeia',
      'Analisar a progressão de acordes de um trecho de 4 compassos (I-IV-V-I ou ii-V-I)',
    )
  } else if (focus === 'improvisacao') {
    const scale = level === 'Iniciante' ? 'pentatônica menor de Lá' : level === 'Intermediário' ? 'Dórico de Ré' : 'escala escolhida pelo aluno'
    activities.push(
      `Improvisação guiada: usar apenas ${scale} sobre backing track de 4 acordes`,
      level !== 'Iniciante'
        ? 'Desenvolver um motivo rítmico de 2 notas e variar durante 8 compassos'
        : 'Improvisar com 3 notas escolhidas: subir, descer e repetir a vontade',
      'Call and response: professor toca frase de 2 compassos, aluno responde com 2 compassos',
    )
    if (level === 'Avançado') {
      activities.push('Improvisar sobre progressão ii-V-I usando arpejo do acorde + abordagem cromática')
    }
  } else if (focus === 'leitura') {
    activities.push(
      'Leitura de trecho novo: ler sem parar do início ao fim, marcando os erros',
      'Segunda leitura: corrigir os erros marcados, foco nos ritmos difíceis',
      'Solfejo: cantar a melodia com nome das notas antes de tocar',
    )
    if (level !== 'Iniciante') {
      activities.push('Leitura à primeira vista de peça fora do repertório (nível -1 de dificuldade)')
    }
  } else if (focus === 'ritmo') {
    activities.push(
      `Trabalhar trecho com batida de metrônomo em cada semínima (${bpm('slow', level)})`,
      'Percussão corporal: bater o ritmo na perna antes de tocar no instrumento',
      'Tocar com backing track: verificar se está no groove ou ligeiramente antes/depois',
    )
    if (level !== 'Iniciante') {
      activities.push(`Padrão em subdivisão de tercinas: tocar frase em colcheia e depois em tercina (${bpm('medium', level)})`)
    }
  } else {
    // misto, tecnica, repertorio — work on actual pieces
    if (piece1) {
      activities.push(
        `Trabalho em "${piece1}": tocar do início ao fim sem parar, marcando trechos difíceis`,
        `"${piece1}": praticar os 2 trechos mais difíceis separadamente (${bpm('slow', level)})`,
      )
    } else {
      activities.push(
        'Trabalho de peça principal: tocar do início ao fim sem parar, marcando erros',
        `Praticar os 2 trechos mais difíceis separadamente (${bpm('slow', level)})`,
      )
    }
    if (piece2) {
      activities.push(`Revisitar "${piece2}": tocar da memória (ou leitura) buscando fluidez`)
    }
    // Focus refinements
    if (focus === 'tecnica') {
      activities.push('Aplicar técnica trabalhada nos exercícios diretamente no trecho da música')
    }
    if (focus === 'repertorio') {
      activities.push('Tocar a música inteira como se fosse uma performance: sem parar para corrigir')
      activities.push('Gravar áudio de 1 execução e ouvir para auto-avaliação')
    }
  }

  // Objective-aligned addition
  if (hasObj(objectives, ['apresent', 'show', 'recital', 'concert', 'performance'])) {
    activities.push('Simular performance: tocar em pé (se possível), imaginar audiência, postura de palco')
  }
  if (hasObj(objectives, ['compor', 'composicao', 'composição', 'criar musica', 'criar música'])) {
    activities.push('Composição: criar 4 compassos novos usando o que foi praticado hoje')
  }

  return activities.slice(0, 5)
}

function reviewActivities(level: StudentLevel, focus: LessonFocus): string[] {
  const base: Record<LessonFocus, string[]> = {
    misto: [
      'Tocar trecho mais desafiador do dia — verificar evolução em relação ao início da aula',
      'Resumo oral: o professor pergunta ao aluno o que aprendeu hoje (reflexão ativa)',
      level === 'Iniciante'
        ? 'Tocar a escala do dia sem parar, do início ao fim'
        : 'Tocar trecho de memória sem partitura',
    ],
    tecnica: [
      'Executar o exercício mais difícil do dia no tempo máximo atingido',
      'Comparar gravação mental: como soava no começo vs. agora?',
      'Identificar qual parte da técnica ainda precisa de atenção na próxima aula',
    ],
    repertorio: [
      'Tocar a música inteira sem parar — execução de performance',
      level !== 'Iniciante'
        ? 'Auto-avaliação: 3 pontos positivos e 1 ponto a melhorar'
        : 'O professor aponta 1 coisa que melhorou muito hoje',
      'Definir ponto de partida para a próxima aula',
    ],
    teoria: [
      'Aplicar conceito teórico: o aluno cria um exemplo próprio do que foi ensinado',
      'Quiz rápido: 5 perguntas sobre o conteúdo da aula (intervalos, acordes, escalas)',
      'Tocar uma progressão usando apenas o que foi aprendido hoje',
    ],
    improvisacao: [
      'Improvisação livre de 2 minutos: usar tudo que foi explorado na aula',
      level !== 'Iniciante'
        ? 'Transcrever mentalmente a melhor frase improvisada e tocá-la de novo'
        : 'Tocar a "sua música" favorita que criou hoje',
      'Conversa: qual nota/frase soou mais interessante e por quê?',
    ],
    leitura: [
      'Reler do início ao fim o trecho trabalhado: comparar fluência com a primeira leitura',
      'Cloze rítmico: o professor omite alguns ritmos na partitura, aluno completa de ouvido',
      'Solfejo final: cantar último trecho lido com precisão de afinação',
    ],
    ritmo: [
      'Tocar trecho rítmico desafiador no metrônomo pela última vez — bater recorde de BPM',
      'Exercício de solidez: tocar 2 minutos sem variar o andamento (metrônomo no 2 e 4)',
      level !== 'Iniciante'
        ? 'Poliritmia final: 2 contra 3 por 30 segundos sem parar'
        : 'Bater palma e tocar ao mesmo tempo: coordenação básica',
    ],
  }
  return base[focus] ?? base.misto
}

function homeworkActivities(cat: InstrCat, level: StudentLevel, focus: LessonFocus): string[] {
  const daysLabel = level === 'Iniciante' ? '10–15 min, 5 dias por semana' : level === 'Intermediário' ? '20–30 min, 5 dias por semana' : '30–45 min por dia'

  const base: string[] = [
    `Praticar o trecho mais difícil trabalhado hoje: ${daysLabel}`,
    level === 'Iniciante'
      ? 'Tocar a escala do dia 3 vezes seguidas sem erros antes de parar'
      : `Trabalhar a passagem mais difícil: ${bpm('slow', level)}, depois ${bpm('medium', level)}`,
  ]

  // Focus-specific homework
  if (focus === 'teoria') {
    base.push('Escrever (no caderno ou app) os acordes da música estudada com seus graus')
    if (level !== 'Iniciante') {
      base.push('Identificar a tonalidade de 1 música nova que goste de ouvir')
    }
  } else if (focus === 'leitura') {
    base.push('Ler 4 compassos novos por dia de um método adequado ao nível')
    base.push('Solfejo: cantar 2 minutos por dia com nome das notas')
  } else if (focus === 'improvisacao') {
    base.push('Improvisar 2 minutos por dia sobre backing track (C blues ou outro escolhido)')
  } else if (focus === 'ritmo') {
    base.push('Praticar com metrônomo todo dia: 5 minutos de groove ou escala rítmica')
  } else {
    base.push(
      level === 'Avançado'
        ? 'Gravar um áudio de si mesmo e enviar para o professor antes da próxima aula'
        : 'Tocar a música completa para um familiar: criar hábito de "mini-performance"',
    )
  }

  // Instrument-specific tip
  const tip: Record<InstrCat, string> = {
    teclado: 'Usar o app "Metronome Beats" ou similar para manter a pulsação estável',
    corda_ded: 'Manter a afinação checada antes de cada sessão de estudo',
    corda_fric: 'Fazer o check de postura antes de começar: cotovelo, arco e posição do queixeiro',
    voz: 'Aquecer a voz 5 minutos antes de qualquer prática (vocalises básicos)',
    percussao: 'Praticar com almofada de treino (practice pad) para não incomodar e focar no controle',
    sopro: 'Verificar a embocadura no espelho 1x por sessão',
    baixo: 'Praticar com o metrônomo em todos os exercícios, inclusive os lentos',
    geral: 'Gravar áudio de uma execução por semana para acompanhar a evolução',
  }
  base.push(tip[cat])

  return base
}

// ─── Title & summary generators ───────────────────────────────────────────────

function buildTitle(focus: LessonFocus, instrument: string, duration: number): string {
  const labels: Record<LessonFocus, string> = {
    misto: 'Aula Completa',
    tecnica: 'Técnica',
    repertorio: 'Repertório',
    teoria: 'Teoria Musical',
    improvisacao: 'Improvisação',
    leitura: 'Leitura & Solfejo',
    ritmo: 'Rítmica',
  }
  return `${labels[focus]} — ${instrument} · ${duration} min`
}

function buildSummary(
  focus: LessonFocus,
  level: StudentLevel,
  instrument: string,
  duration: number,
  difficulties: string[],
  objectives: string,
  teachingMethod?: string,
): string {
  const focusDesc: Record<LessonFocus, string> = {
    misto: 'abordagem equilibrada de aquecimento, técnica e repertório',
    tecnica: 'aprofundamento técnico com exercícios progressivos',
    repertorio: 'polimento e performance do repertório em andamento',
    teoria: 'teoria musical aplicada ao instrumento',
    improvisacao: 'desenvolvimento da criatividade e improvisação',
    leitura: 'leitura de partitura e solfejo',
    ritmo: 'solidez rítmica e trabalho com metrônomo',
  }

  const diffStr =
    difficulties.length > 0
      ? ` Atenção especial para: ${difficulties.slice(0, 2).join(' e ')}.`
      : ''

  const objStr =
    objectives.trim().length > 10
      ? ` Orientado pelo objetivo: "${objectives.trim().slice(0, 60)}${objectives.length > 60 ? '…' : ''}".`
      : ''

  const methodStr =
    teachingMethod && teachingMethod.trim().length > 5
      ? ` Abordagem do professor: ${teachingMethod.trim().slice(0, 80)}${teachingMethod.length > 80 ? '…' : ''}.`
      : ''

  return `Aula de ${duration} minutos para ${instrument} (${level}) com foco em ${focusDesc[focus]}.${diffStr}${objStr}${methodStr} Estrutura didática progressiva: do aquecimento à tarefa de casa.`
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateLessonPlan(input: PlanInput): GeneratedOutput {
  const cat = categorize(input.instrument)
  const times = TIME[input.focus][input.duration]
  const [tAqc, tTec, tPrat, tRev, tHw] = times

  const practiceEmoji: Record<InstrCat, string> = {
    teclado: '🎹',
    corda_ded: '🎸',
    corda_fric: '🎻',
    voz: '🎤',
    percussao: '🥁',
    sopro: '🎷',
    baixo: '🎸',
    geral: '🎵',
  }

  const repertoire = input.repertoireTitles ?? []

  const warmup = warmupActivities(cat, input.level)
  const technique = techniqueActivities(cat, input.level, input.focus, input.difficulties, input.objectives)
  const practice = practiceActivities(cat, input.level, input.focus, input.objectives, repertoire)
  const review = reviewActivities(input.level, input.focus)
  const homework = homeworkActivities(cat, input.level, input.focus)

  // Add teacher observation to the practice section if provided
  if (input.teacherObservation.trim()) {
    practice.push(`Observação do professor: ${input.teacherObservation.trim()}`)
  }

  const sections: LessonPlanSection[] = [
    {
      id: 'aquecimento',
      title: 'Aquecimento',
      emoji: '🎵',
      duration: tAqc,
      activities: warmup.slice(0, tAqc <= 5 ? 2 : 3),
    },
    {
      id: 'tecnica',
      title: 'Técnica',
      emoji: '🎯',
      duration: tTec,
      activities: technique.slice(0, tTec <= 8 ? 2 : tTec <= 15 ? 3 : 4),
    },
    {
      id: 'pratica',
      title: 'Prática Principal',
      emoji: practiceEmoji[cat],
      duration: tPrat,
      activities: practice.slice(0, tPrat <= 10 ? 3 : tPrat <= 20 ? 4 : 5),
    },
    {
      id: 'revisao',
      title: 'Revisão',
      emoji: '🔁',
      duration: tRev,
      activities: review.slice(0, tRev <= 5 ? 2 : 3),
    },
    {
      id: 'tarefa',
      title: 'Tarefa para Casa',
      emoji: '📚',
      duration: tHw,
      activities: homework.slice(0, tHw <= 2 ? 2 : 3),
    },
  ]

  return {
    title: buildTitle(input.focus, input.instrument, input.duration),
    summary: buildSummary(input.focus, input.level, input.instrument, input.duration, input.difficulties, input.objectives, input.teachingMethod),
    sections,
  }
}
