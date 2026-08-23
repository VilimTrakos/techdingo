import { readFileSync, readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const QUESTIONS_DIR = fileURLToPath(new URL('./src/data/questions', import.meta.url))

const VIRTUAL_ID = 'virtual:question-index'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID

/**
 * Gradi lagani indeks pitanja: po temi, `[id, unitId]` za svako pitanje - bez
 * teksta, opcija i objašnjenja.
 *
 * Postoji zato što aplikaciji na svakoj stranici trebaju samo BROJEVI (koliko
 * pitanja ima tema, koliko cjelina, koliko ih čeka na ponavljanje), dok pun
 * tekst treba tek kad lekcija stvarno počne. Bez ovoga bi statički import svih
 * 11 tema u topics.ts povukao ~190 kB gzipanih pitanja u početni chunk, pa bi
 * i posjetitelj koji otvori jednu SQL lekciju skinuo i Mreže i Praksu.
 *
 * Namjerno je virtualni modul, a ne datoteka u repou: generirana datoteka bi
 * mogla zastarjeti, a suradnik koji doda pitanje morao bi se sjetiti pokrenuti
 * codegen. Ovako indeks nastaje pri buildu i ne može biti neusklađen.
 */
function questionIndexPlugin(): Plugin {
  return {
    name: 'techdingo:question-index',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return undefined
      const index: Record<string, [string, string][]> = {}
      for (const file of readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'))) {
        const questions = JSON.parse(readFileSync(join(QUESTIONS_DIR, file), 'utf-8')) as {
          id: string
          unitId: string
        }[]
        index[basename(file, '.json')] = questions.map((q) => [q.id, q.unitId])
      }
      return `export default ${JSON.stringify(index)};`
    },
    // Bez ovoga izmjena pitanja u dev serveru ne bi osvježila brojeve.
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(QUESTIONS_DIR)) return
      const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID)
      if (mod) server.moduleGraph.invalidateModule(mod)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Mora točno odgovarati imenu GitHub repozitorija (project page: user.github.io/techdingo/).
  base: process.env.CI ? '/techdingo/' : '/',
  plugins: [react(), tailwindcss(), questionIndexPlugin()],
  test: {
    // jsdom za sve, ne samo za testove komponenti: čisto logički testovi rade
    // jednako, a jedno okruženje znači da se pri pisanju novog testa ne treba
    // sjetiti nikakvog docblocka.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Svaki testni file dobiva svoj DOM i svoj localStorage - inače bi
    // progress store (modul-singleton) curio stanje između datoteka.
    restoreMocks: true,
  },
})
