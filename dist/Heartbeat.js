"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timeout = exports.Interval = void 0;
class Heartbeat {
    constructor(ms, { onBeat, onTimeout }) {
        this.ms = ms;
        this.beating = false;
        this.interval = new Interval(ms, onBeat);
        this.timeout = new Timeout(ms * 10, () => {
            this.stop();
            onTimeout();
        });
    }
    start() {
        if (this.beating)
            return this;
        this.interval.start();
        this.timeout.start();
        this.beating = true;
        return this;
    }
    stop() {
        var _a, _b, _c, _d;
        if (!this.beating)
            return this;
        (_b = (_a = this.interval).stop) === null || _b === void 0 ? void 0 : _b.call(_a);
        (_d = (_c = this.timeout).stop) === null || _d === void 0 ? void 0 : _d.call(_c);
        this.beating = false;
        return this;
    }
    bump() {
        if (!this.beating)
            return;
        this.timeout.bump();
    }
}
exports.default = Heartbeat;
class Interval {
    constructor(ms, onInterval) {
        this.ms = ms;
        this.onInterval = onInterval;
        this.stop = undefined;
    }
    start() {
        var _a;
        (_a = this.stop) === null || _a === void 0 ? void 0 : _a.call(this);
        const id = setInterval(() => {
            this.onInterval();
        }, this.ms);
        this.stop = () => {
            clearInterval(id);
            delete this.stop;
        };
    }
}
exports.Interval = Interval;
class Timeout {
    constructor(ms, onTimeout) {
        this.ms = ms;
        this.onTimeout = onTimeout;
        this.stop = undefined;
    }
    start() {
        this.bump();
    }
    bump() {
        var _a;
        (_a = this.stop) === null || _a === void 0 ? void 0 : _a.call(this);
        const id = setTimeout(() => {
            var _a;
            (_a = this.stop) === null || _a === void 0 ? void 0 : _a.call(this);
            delete this.stop;
            this.onTimeout();
        }, this.ms);
        this.stop = () => {
            delete this.stop;
            clearTimeout(id);
        };
    }
}
exports.Timeout = Timeout;
//# sourceMappingURL=Heartbeat.js.map