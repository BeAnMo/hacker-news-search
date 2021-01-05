(function () {
    'use strict';

    function runtime(name, expr) {
        console.time(name);
        const result = expr();
        console.timeEnd(name);

        return result;
    }

    function* enumerate(iter) {
        let i = 0;

        for (const item of iter) {
            yield [i, item];

            i++;
        }
    }

    class IndexTrie {
        constructor() {
            this.trie = {};
        }

        get(word) {
            let result = this.trie;

            for (const ch of word) {
                result = result[ch];

                if (result === undefined) {
                    return null;
                }
            }

            return result.$ || null;
        };

        set(word, setter) {
            let cursor = this.trie;
            const L = word.length;
            const eow = L - 1;

            for (const [i, ch] of enumerate(word)) {
                if (cursor[ch]) {
                    if (i === eow && cursor[ch].$) {
                        cursor[ch].$.push(setter(word, ch, i));
                    } else if (i === eow) {
                        cursor[ch].$ = [setter(word, ch, i)];
                    }
                } else {
                    if (i === eow) {
                        cursor[ch] = { '$': [setter(word, ch, i)] };
                    } else {
                        cursor[ch] = {};
                    }
                }

                cursor = cursor[ch];
            }

            return this;
        };

        has(word) {
            return !!this.get(word);
        }

        words() {
            const traverse = function* (trie, path) {
                for (const k of Object.keys(trie)) {
                    if (k === '$') {
                        yield path.join('');
                    } else {
                        yield* traverse(trie[k], [...path, k]);
                    }
                }
            };

            return traverse(this.trie, []);
        };
    }

    function PubSub() {
        let listeners = new Map();

        let self = {
            subscribe(name, proc) {
                listeners.set(name, proc);

                return self;
            },

            unsubscribe(name) {
                listeners.delete(name);

                return self;
            },

            notify(data) {
                for (const [name, proc] of listeners) {
                    proc(data);
                }

                return self;
            }
        };

        return self;
    }

    const RXS = {
        letter: /[a-zA-Z]/i,
        number: /\d/i,
        space: /\s/i,
        punct: /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/i
    };

    function isLetter(ch) { return RXS.letter.test(ch); }
    function isSpace(ch) { return RXS.space.test(ch); }
    function isPunct(ch) { return RXS.punct.test(ch); }
    function isNum(ch) { return RXS.number.test(ch); }

    class InputStream {
        constructor(input) {
            this.input = input;
            this.pos = 0;
        }

        next() {
            return this.input.charAt(this.pos++);
        }

        peek() {
            return this.input.charAt(this.pos);
        }

        eof() {
            return this.peek() === '';
        }

        err(msg) {
            throw new Error(`${msg} @ ${this.pos}`);
        };
    }

    class TokenStream {
        constructor(input) {
            this.current = null;
            this.input = input;
        }

        readWhile(predicate) {
            let str = '';

            while (!this.input.eof() && predicate(this.input.peek())) {
                str += this.input.next();
            }

            return str;
        };

        readNum() {
            let hasDot = false;
            let num = this.readWhile(ch => {
                if (ch === '.') {
                    if (hasDot) {
                        return false;
                    } else {
                        hasDot = true;

                        return true;
                    }
                } else {
                    return isNum(ch);
                }
            });

            return {
                type: 'number',
                value: parseFloat(num)
            };
        };

        readWord() {
            const word = this.readWhile(isLetter);

            return {
                type: "word",
                value: word
            };
        };

        readSpace() {
            return {
                type: 'space',
                value: this.readWhile(isSpace)
            };
        };

        readPunct() {
            return {
                type: 'punctuation',
                value: this.readWhile(isPunct)
            };
        };

        readUnknown() {
            return {
                type: "unknown",
                value: this.input.next()
            };
        };

        peek() {
            return this.current || (this.current = this.readNext());
        }

        next() {
            let token = this.current;
            this.current = null;

            return token || this.readNext();
        };

        eof() {
            return this.peek() === null;
        }

        readNext() {
            if (this.input.eof()) {
                return null;
            } else {
                const ch = this.input.peek();

                if (isLetter(ch)) {
                    return this.readWord();
                } else if (isNum(ch)) {
                    return this.readNum();
                } else if (isSpace(ch)) {
                    return this.readSpace();
                } else if (isPunct(ch)) {
                    return this.readPunct();
                } else {
                    return this.readUnknown();
                }
            }
        };
    }

    function tokenize(str) {
        const stream = new TokenStream(new InputStream(str));

        let results = [];

        while (!stream.eof()) {
            results.push(stream.next());
        }

        return results;
    }

    function termFrequency(tokens) {
        let counts = new Map();

        for (const { value } of tokens) {
            if (!counts.has(value)) {
                counts.set(value, 1);
            } else {
                counts.set(value, counts.get(value) + 1);
            }
        }

        const S = counts.size;

        let results = [];

        for (const [token, count] of counts) {
            results.push({
                term: token,
                count,
                termFrequency: count / S
            });
        }

        return results;
    }

    function selectClass(el, className) {
        return el.getElementsByClassName(className);
    }

    function first([item]) {
        return item;
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
            .map((el, i) => scorable(terms, el, i));

        $prepped.forEach(({ text }, i) => docs.push(text));

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

}());
