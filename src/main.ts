const Apify = require('apify');

Apify.main(async () => {
    const { maxItems, gptsUrls, proxyConfiguration: proxyConfigurationOptions } = await Apify.getInput();

    const urls = gptsUrls ?? [];
    const proxyConfiguration = await Apify.createProxyConfiguration(proxyConfigurationOptions);

    const browser = await Apify.launchPuppeteer({ proxyConfiguration });

    for (const url of urls.slice(0, maxItems || urls.length)) {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });

        const data = await page.evaluate(() => {
            const logo = document.querySelector('.logo-container .logo img')?.src;
            const title = document.querySelector('.title')?.innerText;
            const author = document.querySelector('.type-author-time .author span')?.innerText;
            const description = Array.from(document.querySelectorAll('.bx--snippet--multi pre code')).map(el => el.innerText).join('\n');
            const conversationStarters = Array.from(document.querySelectorAll('.bx--snippet--wraptext pre code')).map(el => el.innerText).join('\n');
            const views = document.querySelector('.stats-icons .icon-wrapper[title^="Views:"] span:last-child')?.innerText;
            const usages = document.querySelector('.stats-icons .icon-wrapper[title^="Usages:"] span:last-child')?.innerText;
            const votes = document.querySelector('.stats-icons .icon-wrapper[title^="Votes:"] span:last-child')?.innerText;
            const tryButtonUrl = document.querySelector('.chatgpt-try-button a')?.href;

            return {
                logo,
                title,
                author,
                description,
                conversationStarters,
                views,
                usages,
                votes,
                tryButtonUrl,
                url
            };
        });

        await Apify.pushData(data);
        await page.close();
    }

    await browser.close();
});
