import IndexTrie from './index-trie';
import PubSub from './pub-sub';
import { tokenize } from './tokenizer';
import { termFrequency } from './tf-idf';
import { runtime } from './utils';

function selectClass(el, className) {
    return el.getElementsByClassName(className);
}

function first([item]) {
    return item;
}

function scoreDoc(terms, normalizedDoc) {
    let score = 0;

    for (const { term, weight, required } of terms) {
        const exists = normalizedDoc.includes(term);

        if (required && !exists) {
            return 0;
        } else if (exists) {
            score += weight;
        }
    }

    return score;
}

function scorable(terms, $el, index) {
    const text = $el.querySelector('.commtext').textContent.toLowerCase();

    return {
        _id: index,
        elem: $el,
        text,
        score: 0
    };
}

function appendChild(el, $item) {
    el.appendChild($item);

    return el;
}

function clearElement(el) {
    el.innerHTML = '';

    return el;
}

function createElement(elName) {
    return document.createElement(elName);
}

function textContent(el, text) {
    if (text === undefined) {
        return el.textContent;
    } else {
        el.textContent = text;

        return el;
    }
}

function writeScore({ score, elem }) {
    const display = `${(score * 100).toFixed(2)}%`;

    const $wrap = appendChild(
        createElement('div'),
        textContent(createElement('h3'), `Relevance: ${display}`)
    );

    return appendChild($wrap, elem);
}

function bulkAppend(el, items) {
    for (const item of items) {
        appendChild(el, item);
    }

    return el;
}

let $Postings = null;
function runScorer(terms, docs) {
    const $commTree = first(selectClass(document, 'comment-tree'));
    const $current = Array.from(selectClass($commTree, 'athing'));

    const $prepped = $current
        .map((el, i) => scorable(terms, el, i))
        .tee(({ text }, i) => docs.push(text));

    $Postings = Postings($prepped);

    return $prepped;
}

function Postings($postings) {
    let _postings = [...$postings];

    let self = {
        filter(scores) {
            const _ids = scores.reduce((acc, { _id, ...rest }) => {
                acc[_id] = rest;

                return acc;
            }, {});
            _postings = $postings
                .filter(({ _id }) => !!_ids[_id])
                .map((item) => ({
                    ...item,
                    score: _ids[item._id].tf_idf
                }))
                .sort((a, b) => b.score - a.score);

            return self;
        },

        reset() {
            _postings = [...$postings];

            return self;
        },

        appendElements() {
            const $commTree = first(selectClass(document, 'comment-tree'));
            const $table = bulkAppend(
                createElement('table'),
                _postings.map(writeScore)
            );

            return appendChild(clearElement($commTree), $table);
        }
    };

    return self;
}

function engine(docs) {
    const totalDocs = docs.length;
    const docsTokens = runtime('[tokenize]', () => docs.map(tokenizeWords));

    let trie = new IndexTrie();

    runtime('[build trie]', () => {
        for (const [i, tokens] of enumerate(docsTokens)) {
            for (const token of termFrequency(tokens)) {
                const { term, termFrequency } = token;

                trie.set(term, () => ({ _id: i, termFrequency }));
            }
        }
    });

    return {
        totalDocs,
        trie,
        search(str) {
            const exprs = str.split(' ');

            return exprs.reduce((acc, expr) => {
                acc.push(...this.tf_idf(expr));

                return acc;
            }, []).sort((a, b) => b.tf_idf - a.tf_idf);
        },
        tf_idf(term) {
            const docs = trie.get(term) || [];
            const numDocs = docs.length;
            const idf = Math.log(totalDocs / numDocs);

            let results = [];

            for (let i = 0; i < numDocs; i++) {
                const { _id, termFrequency } = docs[i];

                results.push({
                    _id,
                    tf: termFrequency,
                    idf: idf,
                    tf_idf: termFrequency * idf
                });
            }

            return results;
        }
    };
}

function tokenizeWords(str) {
    return tokenize(str)
        .filter(({ type }) => type === 'word');
}

let DOCS = [];
runScorer([], DOCS);
let ENGINE = null;
runtime('[init engine]', () => (ENGINE = engine(DOCS)));

let searchListener = PubSub();

function SearchBar() {
    const wrapper = document.createElement('tr');
    const render = `
		<td colspan="2"></td>
		<td>
			<label>Search Job Postings</label>
			<input type="text" id="job-search-bar" />
		</td>
	`;

    wrapper.innerHTML = render;
    wrapper.querySelector('#job-search-bar').onchange = function (e) {
        const found = runtime('[search]', () => ENGINE.search(this.value));

        searchListener.notify(found);

    };

    return wrapper;
}

function SearchResults() {
    const wrapper = document.createElement('tr');

    const render = `
		<td colspan="2"></td>
		<td><div id="job-search-results"></div></td>
	`;
    wrapper.innerHTML = render;
    const results = wrapper.querySelector('#job-search-results');

    searchListener.subscribe('SearchResults', data => {
        const L = data.length;

        results.textContent = `${L} documents found.`;

        if (L === 0) {
            $Postings.reset().appendElements();
        } else {
            $Postings.filter(data).appendElements();
        }
    });

    return wrapper;
}

let SEARCH = document.querySelector('.fatitem tbody');


SEARCH.appendChild(SearchBar());
SEARCH.appendChild(SearchResults());