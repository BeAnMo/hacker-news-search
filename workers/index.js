import { getLatest } from './src/scraper';

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
    try {
        const res = await getLatest();

        console.log(res);
    } catch (e) {
        console.error(e);
    }


    return new Response('Hello worker!', {
        headers: { 'content-type': 'text/plain' },
    });
}
