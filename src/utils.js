export function runtime(name, expr) {
    console.time(name);
    const result = expr();
    console.timeEnd(name);

    return result;
}

export function* enumerate(iter) {
    let i = 0;

    for (const item of iter) {
        yield [i, item];

        i++;
    }
}