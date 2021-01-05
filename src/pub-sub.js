export default function PubSub() {
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
