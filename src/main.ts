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
    logo: 'img.object-fill',
    description: 'p.mt-2.text-slate-600',
    category: '.mt-2 a.hover\\:underline',
    update: 'div.rounded-full:nth-of-type(1)',
    trial: 'div.rounded-full:nth-of-type(2)',
    linkToTool: 'button.bg-ice-500.rounded-full.flex',
    favorites: 'button.hover\\:bg-ice-600.border',
    detail: '.mx-auto div div.mx-auto.px-4',
    videoIframe: '.player-wrapper iframe'
};

let urls: string[] = gptsUrls ?? [];

const proxyConfiguration = await Actor.createProxyConfiguration(proxyConfigurationOptions);

const preNavigationHook = async (requestAsBrowserOptions: any) => {
    requestAsBrowserOptions.waitUntil = 'domcontentloaded';
    await new Promise(resolve => setTimeout(resolve, 2000)); // Espera de 5 segundos
};

const requestHandler = async ({ $, request }: { $: CheerioRoot, request: Request }): Promise<void> => {
    // Utiliza los selectores actualizados para extraer la información
   const logoUrl = $('img.object-fill').attr('src');
    const description = $('p.mt-2.text-slate-600').text();
    const category = $('.mt-2 a.hover\\:underline').text();
    const update = $('div.rounded-full:nth-of-type(1)').text();
    const trial = $('div.rounded-full:nth-of-type(2)').text();
    const linkToTool = $('button.bg-ice-500.rounded-full.flex').attr('href');
    const favorites = $('button.hover\\:bg-ice-600.border').text();
    const detail = $('.mx-auto div div.mx-auto.px-4').text();
    const videoUrl = $(selectors.videoIframe).attr('src');

    const data = {
        logoUrl,
        description,
        category,
        update,
        trial,
        linkToTool,
        favorites,
        detail,
        videoUrl,
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
