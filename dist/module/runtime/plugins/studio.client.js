import { defineNuxtPlugin, useRuntimeConfig } from "#imports";
import { defineStudioActivationPlugin } from "../utils/activation.js";
export default defineNuxtPlugin((nuxtApp) => {
  defineStudioActivationPlugin(async (user) => {
    const config = useRuntimeConfig();
    const host = await (config.public.studio.dev ? import("../host.dev") : import("../host")).then((m) => m.useStudioHost);
    const editorExtensions = [];
    await nuxtApp.callHook("studio:editor:extensions", (factory) => {
      editorExtensions.push(factory);
    });
    const hostInstance = host(user, config.public.studio.repository, editorExtensions);
    window.useStudioHost = () => hostInstance;
    await import("nuxt-studio/app");
    document.body.appendChild(document.createElement("nuxt-studio"));
  });
});
