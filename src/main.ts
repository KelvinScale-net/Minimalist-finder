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
    logo: '.logo-container .logo img',
    title: '.title',
    author: '.type-author-time .author span',
    description: '.bx--snippet--multi pre code',
    conversationStarters: '.bx--snippet--wraptext pre code',
    views: '.stats-icons .icon-wrapper[title^="Views:"] span:last-child',
    usages: '.stats-icons .icon-wrapper[title^="Usages:"] span:last-child',
    votes: '.stats-icons .icon-wrapper[title^="Votes:"] span:last-child',
    tryButton: '.chatgpt-try-button a'
};

let urls: string[] = gptsUrls ?? [];

const proxyConfiguration = await Actor.createProxyConfiguration(proxyConfigurationOptions);

const preNavigationHook = async (requestAsBrowserOptions: any) => {
    requestAsBrowserOptions.waitUntil = 'domcontentloaded';
    await new Promise(resolve => setTimeout(resolve, 2000)); // Espera de 5 segundos
};

const requestHandler = async ({ $, request }: { $: CheerioRoot, request: Request }): Promise<void> => {
    const logoUrl = $('.logo-container .logo img').attr('src');
    const title = $('.title').text();
    const author = $('.type-author-time .author span').text();
    const description = $('.bx--snippet--multi pre code').first().text();
    const conversationStarters = $('.bx--snippet--wraptext pre code').text();
    const views = $(selectors.views).text();
    const usages = $(selectors.usages).text();
    const votes = $(selectors.votes).text();
    const tryButtonUrl = $(selectors.tryButton).attr('href');

    const data = {
        title,
        author,
        description,
        conversationStarters,
        logoUrl,
        views,
        usages,
        votes,
        tryButtonUrl,
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
