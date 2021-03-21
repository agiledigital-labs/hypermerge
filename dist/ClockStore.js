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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Clock = __importStar(require("./Clock"));
const Queue_1 = __importDefault(require("./Queue"));
// NOTE: Joshua Wise (maintainer of better-sqlite3) suggests using multiple
// prepared statements rather than batch inserts and selects :shrugging-man:.
// We'll see if this becomes an issue.
class ClockStore {
    constructor(db) {
        this.db = db;
        this.updateQ = new Queue_1.default();
        this.preparedGet = this.db.prepare(`SELECT * FROM Clocks WHERE repoId=? AND documentId=?`);
        this.preparedInsert = this.db.prepare(`INSERT INTO Clocks (repoId, documentId, actorId, seq)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (repoId, documentId, actorId)
       DO UPDATE SET seq=excluded.seq WHERE excluded.seq > seq`);
        this.preparedDelete = this.db.prepare('DELETE FROM Clocks WHERE repoId=? AND documentId=?');
        this.preparedAllRepoIds = this.db.prepare('SELECT DISTINCT repoId from Clocks').pluck();
        this.preparedAllDocumentIds = this.db
            .prepare('SELECT DISTINCT documentId from Clocks WHERE repoId=?')
            .pluck();
        this.preparedAllForDocumentId = this.db.prepare('SELECT * FROM Clocks WHERE documentId = ?');
    }
    /**
     * TODO: handle missing clocks better. Currently returns an empty clock (i.e. an empty object)
     */
    get(repoId, documentId) {
        const clockRows = this.preparedGet.all(repoId, documentId);
        return rowsToClock(clockRows);
    }
    has(repoId, documentId) {
        return !!this.preparedGet.get(repoId, documentId);
    }
    /**
     * Retrieve the clocks for all given documents. If we don't have a clock
     * for a document, the resulting ClockMap won't have an entry for that document id.
     */
    getMultiple(repoId, documentIds) {
        const transaction = this.db.transaction((docIds) => {
            return docIds.reduce((clockMap, docId) => {
                const clock = this.get(repoId, docId);
                if (clock)
                    clockMap[docId] = clock;
                return clockMap;
            }, {});
        });
        return transaction(documentIds);
    }
    /**
     * Update an existing clock with a new clock, merging the two.
     * If no clock exists in the data store, the new clock is stored as-is.
     */
    update(repoId, documentId, clock) {
        const transaction = this.db.transaction((clockEntries) => {
            clockEntries.forEach(([feedId, seq]) => {
                this.preparedInsert.run(repoId, documentId, feedId, seq);
            });
            return this.get(repoId, documentId);
        });
        const updatedClock = transaction(Object.entries(clock));
        const descriptor = [updatedClock, documentId, repoId];
        if (!Clock.equal(clock, updatedClock)) {
            this.updateQ.push(descriptor);
        }
        return descriptor;
    }
    /**
     * Hard set of a clock. Will clear any clock values that exist for the given document id
     * and set explicitly the passed in clock.
     */
    set(repoId, documentId, clock) {
        const transaction = this.db.transaction((documentId, clock) => {
            this.preparedDelete.run(repoId, documentId);
            return this.update(repoId, documentId, clock);
        });
        return transaction(documentId, clock);
    }
    getAllDocumentIds(repoId) {
        return this.preparedAllDocumentIds.all(repoId);
    }
    getAllRepoIds() {
        return this.preparedAllRepoIds.all();
    }
    getAllForDocumentId(docId) {
        const result = this.preparedAllForDocumentId.all(docId);
        // TODO: yuck
        const byRepoId = result.reduce((accum, row) => {
            const clock = accum[row.repoId] || {};
            clock[row.actorId] = row.seq;
            accum[row.repoId] = clock;
            return accum;
        }, {});
        return Object.entries(byRepoId).map(([repoId, clock]) => [
            clock,
            docId,
            repoId,
        ]);
    }
    getMaximumSatisfiedClock(docId, candidate) {
        const clocks = this.getAllForDocumentId(docId).map(([clock]) => clock);
        const satisfiedClocks = clocks.filter((clock) => Clock.isSatisfied(clock, candidate));
        return Clock.getMax(satisfiedClocks);
    }
}
exports.default = ClockStore;
function rowsToClock(rows) {
    return rows.reduce((clock, row) => {
        clock[row.actorId] = row.seq;
        return clock;
    }, {});
}
//# sourceMappingURL=ClockStore.js.map