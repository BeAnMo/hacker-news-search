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

export function tokenize(str) {
    const stream = new TokenStream(new InputStream(str));

    let results = [];

    while (!stream.eof()) {
        results.push(stream.next());
    }

    return results;
}