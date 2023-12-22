import { Actor, ProxyConfigurationOptions } from 'apify';
import { CheerioCrawler, log } from 'crawlee';
import fs from 'fs';
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

const requestHandler = async ({ $, request }): Promise<void> => {
    const data = {
        title: $(selectors.title).text(),
        author: $(selectors.author).text(),
        description: $(selectors.description).text(),
        logoUrl: $(selectors.logo).attr('src'),
        conversationStarters: $(selectors.conversationStarters).text(),
        views: $(selectors.views).text(),
        usages: $(selectors.usages).text(),
        votes: $(selectors.votes).text(),
        tryButtonUrl: $(selectors.tryButton).attr('href'),
        url: request.loadedUrl
    };

    await Actor.pushData(data);
};

const crawler = new CheerioCrawler({
    proxyConfiguration,
    requestHandler,
    failedRequestHandler({ request }) {
        log.error(`Request for url ${request.url} failed.`);
    }
});

/*if (maxItems && maxItems > 0) {
    urls = urls.slice(0, maxItems);
}*/

await crawler.run(urls);
await Actor.exit();
