
import cheerio from 'cheerio';

function HackerNewsUrl({ path = [], params = null }) {
    const base = new URL('https://news.ycombinator.com');

    if (path.length) {
        base.pathname = path.join('/');
    }

    if (params) {
        base.search = new URLSearchParams(params);
    }

    return base;
}

function getPage({ path, params }) {
    return fetch(HackerNewsUrl({ path, params }), {
        method: 'GET',
    }).then(r => r.text());
}

function loadPage(text) {
    return cheerio.load(text);
}

function getComments($) {
    let comments = [];

    $('.comment-tree .athing .comment .commtext')
        .each(function (i, $el) {
            comments.push({
                id: i,
                text: $(this).text().toLowerCase(),
                score: 0
            });
        });

    return comments;
}

export async function getLatest(event) {
    const comments = await getPage({ path: ['item'], params: { id: '25632982' } })
        .then(loadPage)
        .then(getComments);


    await hacker_news_search_data.put('page0', comments);

    return comments;
}