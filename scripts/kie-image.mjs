#!/usr/bin/env node
/**
 * Generate an image with Kie.ai (OpenAI GPT Image 2.6 "flare") at 1K and save it locally.
 *
 * Usage:
 *   node --env-file=.env scripts/kie-image.mjs --out supabase/seed/media/site/hero.png \
 *     --aspect 16:9 --prompt "..." [--ref https://public/url.png ...] [--quality high]
 *
 * Text-to-image by default; passing one or more --ref URLs switches to image-to-image.
 * Docs: https://docs.kie.ai  (createTask -> poll recordInfo -> resultJson.resultUrls)
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    prompt: { type: 'string' },
    out: { type: 'string' },
    aspect: { type: 'string', default: '1:1' },
    quality: { type: 'string', default: 'high' },
    format: { type: 'string', default: 'png' },
    ref: { type: 'string', multiple: true },
  },
})

const KEY = process.env.KIE_API_KEY
if (!KEY) throw new Error('KIE_API_KEY missing (run with --env-file=.env)')
if (!values.prompt || !values.out) throw new Error('--prompt and --out are required')

const API = 'https://api.kie.ai/api/v1/jobs'
const headers = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const refs = values.ref ?? []
const model = refs.length ? 'gpt-image-2-6/flare-image-to-image' : 'gpt-image-2-6/flare-text-to-image'

const body = {
  model,
  input: {
    prompt: values.prompt,
    aspect_ratio: values.aspect,
    resolution: '1K',
    quality: values.quality,
    output_format: values.format,
    ...(refs.length ? { input_urls: refs } : {}),
  },
}

const created = await fetch(`${API}/createTask`, { method: 'POST', headers, body: JSON.stringify(body) }).then((r) => r.json())
if (created.code !== 200) throw new Error(`createTask failed: ${JSON.stringify(created)}`)
const taskId = created.data.taskId
console.log(`task ${taskId} (${model})`)

let delay = 3000
for (let i = 0; i < 80; i++) {
  await new Promise((r) => setTimeout(r, delay))
  delay = Math.min(delay * 1.3, 15000)
  const rec = await fetch(`${API}/recordInfo?taskId=${taskId}`, { headers }).then((r) => r.json())
  const state = rec?.data?.state
  if (state === 'success') {
    const urls = JSON.parse(rec.data.resultJson).resultUrls
    const buf = Buffer.from(await fetch(urls[0]).then((r) => r.arrayBuffer()))
    await mkdir(dirname(values.out), { recursive: true })
    await writeFile(values.out, buf)
    console.log(`saved ${values.out} (${(buf.length / 1024).toFixed(0)} KB, credits ${rec.data.creditsConsumed})`)
    process.exit(0)
  }
  if (state === 'fail') throw new Error(`generation failed: ${rec.data.failCode} ${rec.data.failMsg}`)
  process.stdout.write(`${state ?? JSON.stringify(rec)} `)
}
throw new Error('timed out waiting for Kie task')
