// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/)
import { Actor, ProxyConfigurationOptions } from 'apify';
import { CheerioCrawler, Dataset, log } from 'crawlee';
import fs from 'fs'
import { GPTS } from './types';

interface Input {
    maxItems: number;
    gptsUrls: string[]
    proxyConfiguration: ProxyConfigurationOptions
}

// The init() call configures the Actor for its environment. It's recommended to start every Actor with an init()
await Actor.init();



// Structure of input is defined in input_schema.json
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


const BASEURL = 'https://www.google.com'

let urls: string[] = []
let currentPage = 0

const proxyConfiguration = await Actor.createProxyConfiguration(proxyConfigurationOptions);

if (!gptsUrls) {
    const googleCrawler = new CheerioCrawler({
        maxConcurrency: 1,
        maxRequestRetries: 3,
        async requestHandler({ request, $ }) {
            const links = $(selectors['url'])
                .map((_, el) => $(el).attr('href'))
                .get().filter(item => {
                    return item.startsWith('https://chat.openai.com/g/')
                })

            urls.push(...links)


            const nextPage = $(selectors['next']).attr('href')
            if (!nextPage) {
                if (links.length) {
                    const prevUrl = request.loadedUrl
                    const page = (currentPage + 1) * 10
                    const nextUrl = prevUrl?.replace(/start=\d+/, `start=${page}`);
                    if (nextUrl) {
                        currentPage++
                        await googleCrawler.addRequests([nextUrl]);
                    }
                }
            } else {
                const nextUrl = BASEURL + nextPage;
                if (nextUrl) {
                    console.log(nextUrl)
                    currentPage++
                    await googleCrawler.addRequests([nextUrl]);
                }
            }
        },
        failedRequestHandler({ request }) {
            log.error(`Request for url ${request.url} failed.`);
        }
    });
    await googleCrawler.run([BASEURL + '/search?q=site://chat.openai.com/g/']);
} else {
    urls = gptsUrls
}



const crawler = new CheerioCrawler({
    proxyConfiguration,
    minConcurrency: 1,
    maxConcurrency: 5,
    maxRequestRetries: 5,

    // Increase the timeout for processing of each page.
    requestHandlerTimeoutSecs: 30,
    persistCookiesPerSession: true,

    sessionPoolOptions: {
        maxPoolSize: 10,
        sessionOptions: {
            maxErrorScore: 3,
            maxUsageCount: 100
        },
    },
    useSessionPool: true,


// Modificar el requestHandler
const requestHandler = async ({ $, request }) => {
    // Utiliza los selectores para extraer los datos
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
        id: request.id, // o cualquier otra lógica para obtener el id
        url: request.loadedUrl
    };

    await Actor.pushData(data);
};

// Configuración del CheerioCrawler
const crawler = new CheerioCrawler({
    // ...
    requestHandler,
    // ...
    failedRequestHandler({ request }) {
        log.error(`Request for url ${request.url} failed.`);
    }
});

// Reduce the number of apps to crawl
if (maxItems && maxItems > 0) {
    urls = urls.slice(0, maxItems);
}

await crawler.run(urls);
// for testing
// await crawler.run(['https://chat.openai.com/g/g-N1SJLto6i-elsa']);

await Actor.exit();
