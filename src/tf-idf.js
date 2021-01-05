export function termFrequency(tokens) {
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
