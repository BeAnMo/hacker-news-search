import { enumerate } from './utils';

export default class IndexTrie {
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
