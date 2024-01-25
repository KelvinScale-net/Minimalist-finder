import { Actor, ProxyConfigurationOptions } from 'apify';
import { CheerioCrawler, log, CheerioRoot, Request } from 'crawlee';
import { GPTS } from './types';

interface Input {
    maxItems: number;
    gptsUrls: string[];
    proxyConfiguration: ProxyConfigurationOptions;
}

await Actor.init();

const { maxItems, gptsUrls, proxyConfiguration: proxyConfigurationOptions } = await Actor.getInput<Input>() ?? {} as Input;

const selectors = {
    title: '.text-5xl.font-semibold.text-darkBlue',
    description: '.mt-2.text-slate-600',
    category: '.hover\\:underline',
    update: '.flex.gap-2.rounded-full.bg-slate-100.px-4.py-2.text-slate-600',
    tag: '.flex.gap-2.rounded-full.bg-slate-100.px-4.py-2.text-slate-600', // Nota: mismo selector que 'update', verifica si es correcto
    video: '.order-1.flex.w-full.flex-col.gap-4.lg\\:order-2',
    detail: '.prose-base.prose-slate.prose-invert.prose-headings\\:scroll-m-24.prose-headings\\:font-bold.prose-headings\\:text-slate-800.prose-headings\\:text-opacity-90.prose-p\\:text-slate-800.prose-p\\:text-opacity-80.prose-a\\:underline.prose-a\\:decoration-inherit.prose-ol\\:list-decimal.prose-ol\\:text-slate-800.prose-ol\\:text-opacity-80.prose-ul\\:list-disc.prose-ul\\:text-slate-800.prose-ul\\:text-opacity-80'
};

let urls: string[] = gptsUrls ?? [];

const proxyConfiguration = await Actor.createProxyConfiguration(proxyConfigurationOptions);

const preNavigationHook = async (requestAsBrowserOptions: any) => {
    requestAsBrowserOptions.waitUntil = 'domcontentloaded';
    await new Promise(resolve => setTimeout(resolve, 2000)); // Espera de 5 segundos
};

const requestHandler = async ({ $, request }: { $: CheerioRoot, request: Request }): Promise<void> => {
    // Utiliza los selectores actualizados para extraer la información
    const title = $(selectors.title).text();
    const description = $(selectors.description).text();
    const category = $(selectors.category).text();
    const update = $(selectors.update).text();
    const tag = $(selectors.tag).text();
    const videoUrl = $(selectors.video).find('video').attr('src'); // Asumiendo que quieres la URL del video
    const detail = $(selectors.detail).text();

    const data = {
        title,
        description,
        category,
        update,
        tag,
        videoUrl,
        detail,
        url: request.loadedUrl
    };
    await Actor.pushData(data);
};

const crawler = new CheerioCrawler({
    proxyConfiguration,
    requestHandler,
    preNavigationHooks: [preNavigationHook],
    failedRequestHandler({ request }) {
        log.error(`Request for url ${request.url} failed.`);
    }
});

await crawler.run(urls);
await Actor.exit();
