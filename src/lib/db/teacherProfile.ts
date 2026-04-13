import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeacherProfile {
  instrumento:       string
  estilo_aula:       string
  nivel:             string
  faixa_etaria:      string
  dificuldade:       string
  acompanhamento:    string
  quantidade_alunos: string
}

// ─── DB functions ─────────────────────────────────────────────────────────────

export async function getTeacherProfile(userId: string): Promise<TeacherProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('teacher_profiles')
    .select('instrumento, estilo_aula, nivel, faixa_etaria, dificuldade, acompanhamento, quantidade_alunos')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null

  return {
    instrumento:       data.instrumento,
    estilo_aula:       data.estilo_aula,
    nivel:             data.nivel,
    faixa_etaria:      data.faixa_etaria,
    dificuldade:       data.dificuldade,
    acompanhamento:    data.acompanhamento,
    quantidade_alunos: data.quantidade_alunos,
  }
}

export async function saveTeacherProfile(userId: string, profile: TeacherProfile): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('teacher_profiles')
    .upsert(
      { user_id: userId, ...profile, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  if (error) throw error
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a readable label for the teacher's instrument */
export function instrumentLabel(instrumento: string): string {
  const map: Record<string, string> = {
    piano:   'Piano',
    violino: 'Violino',
    violao:  'Violão',
    outro:   'Outro instrumento',
  }
  return map[instrumento] ?? instrumento
}

/** Builds a short AI system prompt from the teacher profile */
export function buildTeacherContext(profile: TeacherProfile): string {
  const parts = [
    `Instrumento principal: ${instrumentLabel(profile.instrumento)}.`,
    `Estilo de aula: ${profile.estilo_aula}.`,
    `Nível dos alunos: ${profile.nivel}.`,
    `Faixa etária: ${profile.faixa_etaria}.`,
    `Principal dificuldade: ${profile.dificuldade}.`,
    `Acompanhamento de evolução: ${profile.acompanhamento}.`,
    `Quantidade de alunos: ${profile.quantidade_alunos}.`,
  ]
  return `Perfil do professor — ${parts.join(' ')}`
}
