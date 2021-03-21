"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actor = void 0;
const Misc_1 = require("./Misc");
const Queue_1 = __importDefault(require("./Queue"));
const Block = __importStar(require("./Block"));
const Keys = __importStar(require("./Keys"));
const Debug_1 = __importDefault(require("./Debug"));
const log = Debug_1.default('Actor');
class Actor {
    constructor(config) {
        this.changes = [];
        // Note: on Actor ready, not Feed!
        this.onReady = (cb) => {
            this.q.push(cb);
        };
        this.onFeedReady = (feed) => __awaiter(this, void 0, void 0, function* () {
            this.notify({ type: 'ActorFeedReady', actor: this, writable: feed.writable, feed });
            feed.on('close', this.onClose);
            if (!feed.writable) {
                feed.on('download', this.onDownload);
                feed.on('sync', this.onSync);
            }
            let hasData = false;
            let sequenceNumber = 0;
            const data = yield this.store.stream(this.id);
            data.on('data', (chunk) => {
                this.parseBlock(chunk, sequenceNumber);
                sequenceNumber += 1;
                hasData = true;
            });
            data.on('end', () => {
                this.q.subscribe((f) => f(this));
                if (hasData)
                    this.onSync();
            });
        });
        this.onDownload = (index, data) => {
            this.parseBlock(data, index);
            const time = Date.now();
            const size = data.byteLength;
            this.notify({ type: 'Download', actor: this, index, size, time });
        };
        this.onSync = () => {
            log('sync feed', Misc_1.ID(this.id));
            this.notify({ type: 'ActorSync', actor: this });
        };
        this.onClose = () => {
            this.close();
        };
        const { publicKey } = config.keys;
        const dk = Keys.discoveryKey(publicKey);
        const id = Misc_1.encodeActorId(publicKey);
        this.id = id;
        this.store = config.store;
        this.notify = config.notify;
        this.dkString = Keys.encode(dk);
        this.q = new Queue_1.default('repo:actor:Q' + id.slice(0, 4));
        this.getOrCreateFeed(Keys.encodePair(config.keys)).then((feed) => {
            feed.ready(() => this.onFeedReady(feed));
        });
    }
    writeChange(change) {
        const feedLength = this.changes.length;
        const ok = feedLength + 1 === change.seq;
        log(`write actor=${this.id} seq=${change.seq} feed=${feedLength} ok=${ok}`);
        this.changes.push(change);
        this.onSync();
        this.store.append(this.id, Block.pack(change));
    }
    close() {
        return this.store.closeFeed(this.id);
    }
    getOrCreateFeed(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            let feedId;
            if (keys.secretKey) {
                feedId = yield this.store.create(keys);
            }
            else {
                feedId = keys.publicKey;
            }
            return this.store.getFeed(feedId);
        });
    }
    parseBlock(data, index) {
        const change = Block.unpack(data); // no validation of Change
        this.changes[index] = change;
        log(`block xxx idx=${index} actor=${Misc_1.ID(change.actor)} seq=${change.seq}`);
    }
}
exports.Actor = Actor;
//# sourceMappingURL=Actor.js.map