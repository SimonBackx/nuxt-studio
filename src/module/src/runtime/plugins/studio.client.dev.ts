import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { consola } from 'consola'
import { defineStudioActivationPlugin } from '../utils/activation'
import type { Repository, UseStudioHost, StudioEditorExtensionFactory } from 'nuxt-studio/app'

const logger = consola.withTag('Nuxt Studio')

export default defineNuxtPlugin((nuxtApp) => {
  defineStudioActivationPlugin(async (user) => {
    const config = useRuntimeConfig()
    logger.info(`
  ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗     ██████╗ ███████╗██╗   ██╗
  ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗    ██╔══██╗██╔════╝██║   ██║
  ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║    ██║  ██║█████╗  ██║   ██║
  ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║    ██║  ██║██╔══╝  ╚██╗ ██╔╝
  ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝    ██████╔╝███████╗ ╚████╔╝
  ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝     ╚═════╝ ╚══════╝  ╚═══╝
    `)

    // Initialize host
    const host = await import('../host.dev').then(m => m.useStudioHost)
    // Let the host app register custom editor extensions (see StudioEditorExtensionFactory)
    const editorExtensions: StudioEditorExtensionFactory[] = []
    await nuxtApp.callHook('studio:editor:extensions', (factory: StudioEditorExtensionFactory) => { editorExtensions.push(factory) })
    const hostInstance = host(user, config.public.studio.repository as Repository, editorExtensions);
    (window as unknown as { useStudioHost: UseStudioHost }).useStudioHost = () => hostInstance

    const el = document.createElement('script')
    el.src = `${config.public.studio?.development?.server}/src/main.ts`
    el.type = 'module'
    document.body.appendChild(el)

    const wp = document.createElement('nuxt-studio')
    document.body.appendChild(wp)
  })
})
