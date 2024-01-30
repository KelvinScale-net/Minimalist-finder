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
    brandName: "tr:contains('Brand Name') th",
    anyasNotes: "tr:contains('Anya's Notes') td",
    availableSizes: "tr:contains('Available Sizes') td",
    pricing: "tr:contains('Pricing') td",
    returns: "tr:contains('Returns') td",
    features: "tr:contains('Features') td",
    availableFrom: "div.col-md-8"
};

let urls: string[] = gptsUrls ?? [];

const proxyConfiguration = await Actor.createProxyConfiguration(proxyConfigurationOptions);

const preNavigationHook = async (requestAsBrowserOptions: any) => {
    requestAsBrowserOptions.waitUntil = 'domcontentloaded';
    await new Promise(resolve => setTimeout(resolve, 2000)); // Espera de 5 segundos
};

const requestHandler = async ({ $, request }: { $: CheerioRoot, request: Request }): Promise<void> => {
    // Utiliza los selectores actualizados para extraer la información
    const brandName = $(selectors.brandName).text();
    const anyasNotes = $(selectors.anyasNotes).text();
    const availableSizes = $(selectors.availableSizes).text();
    const pricing = $(selectors.pricing).text();
    const returns = $(selectors.returns).text();
    const features = $(selectors.features).text();
    const availableFrom = $(selectors.availableFrom).text();

    const data = {
        brandName,
        anyasNotes,
        availableSizes,
        pricing,
        returns,
        features,
        availableFrom,
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
