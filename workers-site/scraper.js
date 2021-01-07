
function Store(namespace) {
    return {
        get: namespace,
        set: namespace.put
    };
}

const Datastore = Store(hacker_news_search_data);

function HackerNewsUrl({ path = [], params = null }) {
    const base = new URL('https://news.ycombinator.com');

    if (path.length) {
        base.pathname = path.join('/');
    }

    if (params) {
        base.searchParams = new URLSearchParams(params);
    }

    return base;
}

function getPage({ path, params }) {
    return fetch(HackerNewsUrl({ path, params }), {
        method: 'GET',
    }).then(r => r.text());
}

export async function getLatest(event) {
    const page = await getPage({ path: ['item'], params: { id: '25632982' } });

    await Datastore.set('page', page);
}