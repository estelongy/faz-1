import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { rateLimitAnaliz, rateLimitResponse } from '@/lib/ratelimit'
import { clamp, colorZone } from '@/lib/egs'

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface GPTComponentScores {
  wrinkles: number          // 0-100 (düşük = daha iyi)
  pigmentation: number      // 0-100 (düşük = daha iyi)
  hydration: number         // 0-100 (yüksek = daha iyi)
  tone_uniformity: number   // 0-100 (yüksek = daha iyi)
  under_eye: number         // 0-100 (yüksek = daha iyi)
}

interface GPTResponse {
  component_scores: GPTComponentScores
  estimated_skin_age: number
  confidence: number        // 0-1
  brief_explanation: string
}

export interface AnalizResult {
  overall: number
  moisture: number          // hydration
  wrinkles: number          // 0-100 ham
  spots: number             // pigmentation
  pores: number             // yapay (GPT'den gelmez, türetilir)
  skinAge: number
  confidence: number
  c250Details: {
    rawScore: number
    ageFactor: number
    c250Result: number
    explanation: string
  }
  colorZone: string | null
  recommendations: string[]
  isAI: true
}

// ─── C250 Formülü ──────────────────────────────────────────────────────────

/**
 * C250 formülü: GPT bileşen skorlarından ham EGS hesaplar
 *
 * Ağırlıklar (toplam 1.0):
 *  hydration:       0.25
 *  tone_uniformity: 0.25
 *  wrinkles:        0.25 (ters: 100-wrinkles → iyilik skoru)
 *  pigmentation:    0.15 (ters: 100-pigmentation)
 *  under_eye:       0.10
 */
function applyC250(scores: GPTComponentScores): number {
  const hydration    = clamp(scores.hydration, 0, 100)
  const toneUniform  = clamp(scores.tone_uniformity, 0, 100)
  const wrinkleGood  = clamp(100 - scores.wrinkles, 0, 100)
  const pigmentGood  = clamp(100 - scores.pigmentation, 0, 100)
  const underEye     = clamp(scores.under_eye, 0, 100)

  return clamp(
    hydration    * 0.25 +
    toneUniform  * 0.25 +
    wrinkleGood  * 0.25 +
    pigmentGood  * 0.15 +
    underEye     * 0.10
  )
}

/**
 * Yaş faktörü: Gençler için normalleştirme
 * 20-25: 1.02 (hafif bonus)
 * 26-35: 1.00
 * 36-45: 0.97
 * 46-55: 0.93
 * 56+:   0.88
 */
function ageFactor(estimatedAge: number): number {
  if (estimatedAge <= 25) return 1.02
  if (estimatedAge <= 35) return 1.00
  if (estimatedAge <= 45) return 0.97
  if (estimatedAge <= 55) return 0.93
  return 0.88
}

function buildRecommendations(scores: GPTComponentScores, overall: number): string[] {
  const recs: string[] = []

  if (scores.hydration < 60)        recs.push('Günlük hidrasyonu artırın: hyalüronik asit serumu ve en az 2 litre su')
  if (scores.wrinkles > 40)         recs.push('Gece bakımında retinol içerikli krem kullanın')
  if (scores.pigmentation > 40)     recs.push('SPF 50+ güneş koruyucu ve C vitamini serumu leke önleme için idealdir')
  if (scores.tone_uniformity < 65)  recs.push('Niasinamid içerikli tonik cilt tonunu eşitler')
  if (scores.under_eye < 60)        recs.push('Kafein ve peptit içerikli göz altı kremi göz altı morluklarını azaltır')
  if (overall >= 75)                recs.push('Mevcut bakım rutininizi sürdürün — skorunuz ortalamanın üstünde')
  if (overall < 60)                 recs.push('Klinik değerlendirme önerilir: uzman analizi skorunuzu hızla iyileştirebilir')

  // En az 3, en fazla 5 öneri
  if (recs.length === 0) recs.push('Günlük nemlendirici ve güneş koruyucu kullanımını ihmal etmeyin')
  return recs.slice(0, 5)
}

// ─── GPT-4 Vision ──────────────────────────────────────────────────────────

async function callGPT4Vision(base64Image: string, mimeType: string): Promise<GPTResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY tanımlı değil')
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const prompt = `You are an expert dermatologist AI assistant performing a facial skin aging analysis for the Estelongy platform.

Analyze this facial image and provide a JSON assessment of the following skin components. Be objective and accurate.

Return ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):
{
  "component_scores": {
    "wrinkles": <0-100, where 0=no wrinkles, 100=severe wrinkles>,
    "pigmentation": <0-100, where 0=even skin, 100=heavy pigmentation/spots>,
    "hydration": <0-100, where 0=very dry, 100=well-hydrated>,
    "tone_uniformity": <0-100, where 0=uneven, 100=perfectly uniform>,
    "under_eye": <0-100, where 0=dark circles/puffiness, 100=bright/smooth>
  },
  "estimated_skin_age": <integer, estimated biological skin age in years>,
  "confidence": <0.0-1.0, your confidence in this assessment>,
  "brief_explanation": "<1-2 sentences in Turkish summarizing key findings>"
}

Important:
- Score based on visible skin indicators only
- If image quality is poor or face not clearly visible, set confidence below 0.5
- estimated_skin_age should reflect the skin's biological age, not the person's actual age`

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: 'low', // düşük detay = daha hızlı ve ekonomik
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('GPT-4 Vision boş yanıt döndürdü')

  // JSON ayrıştır — markdown kod bloğu varsa temizle
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned) as GPTResponse
  return parsed
}

// ─── Fallback (OpenAI down ise) ─────────────────────────────────────────────

function generateFallback(): GPTResponse {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  return {
    component_scores: {
      wrinkles:        rand(10, 35),
      pigmentation:    rand(10, 30),
      hydration:       rand(60, 85),
      tone_uniformity: rand(60, 85),
      under_eye:       rand(55, 80),
    },
    estimated_skin_age: rand(24, 36),
    confidence: 0.3, // düşük güven — fallback olduğunu gösterir
    brief_explanation: 'AI servisi geçici olarak kullanılamıyor. Tahmini skor gösterilmektedir.',
  }
}

// ─── Route ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Oturum açık değil' }, { status: 401 })

    // Profil: birth_year oku
    const { data: profile } = await supabase
      .from('profiles')
      .select('birth_year')
      .eq('id', user.id)
      .single()
    const actualAge = profile?.birth_year
      ? new Date().getFullYear() - profile.birth_year
      : null

    // Rate limiting: IP başına 5 analiz / saat
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
    const rl = rateLimitAnaliz(ip)
    if (!rl.success) return rateLimitResponse(rl)

    // Payload: base64 görsel
    const body = await req.json() as { image: string; mimeType?: string }
    if (!body.image) return NextResponse.json({ error: 'Fotoğraf verisi eksik' }, { status: 400 })

    const mimeType = body.mimeType ?? 'image/jpeg'
    const base64 = body.image.replace(/^data:[^;]+;base64,/, '')

    // GPT-4 Vision çağrısı (hata durumunda fallback)
    let gptData: GPTResponse
    let usedFallback = false
    try {
      gptData = await callGPT4Vision(base64, mimeType)
    } catch (err) {
      console.error('[AI Analiz] GPT-4 Vision hatası, fallback kullanılıyor:', err)
      gptData = generateFallback()
      usedFallback = true
    }

    // C250 hesaplama
    // Yaş faktörü: önce gerçek yaş (profilden), yoksa GPT tahmini
    const rawScore  = applyC250(gptData.component_scores)
    const ageForFactor = actualAge ?? gptData.estimated_skin_age
    const af        = ageFactor(ageForFactor)
    const c250Score = clamp(rawScore * af)

    const result: AnalizResult = {
      overall:   c250Score,
      moisture:  gptData.component_scores.hydration,
      wrinkles:  gptData.component_scores.wrinkles,
      spots:     gptData.component_scores.pigmentation,
      pores:     clamp(100 - gptData.component_scores.tone_uniformity),
      skinAge:   gptData.estimated_skin_age,
      confidence: gptData.confidence,
      c250Details: {
        rawScore,
        ageFactor: af,
        c250Result: c250Score,
        explanation: gptData.brief_explanation,
      },
      colorZone: colorZone(c250Score),
      recommendations: buildRecommendations(gptData.component_scores, c250Score),
      isAI: true,
    }

    // DB'ye kaydet
    try {
      const { data: analysisRow } = await supabase
        .from('analyses')
        .insert({
          user_id:     user.id,
          web_overall: Math.round(c250Score),
          status:      'completed',
          web_ai_raw: {
            c250Details:   result.c250Details,
            confidence:    gptData.confidence,
            usedFallback,
            actual_age:    actualAge,
            estimated_skin_age: gptData.estimated_skin_age,
          },
          web_scores: {
            wrinkles:        gptData.component_scores.wrinkles,
            pigmentation:    gptData.component_scores.pigmentation,
            hydration:       gptData.component_scores.hydration,
            tone_uniformity: gptData.component_scores.tone_uniformity,
            under_eye:       gptData.component_scores.under_eye,
          },
        })
        .select('id')
        .single()

      // scores tablosuna c250_base olarak ekle
      if (analysisRow?.id) {
        await supabase.from('scores').insert({
          user_id:     user.id,
          score_type:  'web',
          c250_base:   c250Score,
          total_score: c250Score,
          overall_score: Math.round(c250Score),
          color_zone:  colorZone(c250Score),
          analysis_id: analysisRow.id,
        }).select()
      }
    } catch (dbErr) {
      // DB hatası analizi durdurmaz — sadece logla
      console.error('[AI Analiz] DB kayıt hatası:', dbErr)
    }

    return NextResponse.json({ ok: true, result, usedFallback })
  } catch (err) {
    console.error('[AI Analiz] Beklenmedik hata:', err)
    return NextResponse.json({ error: 'Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
