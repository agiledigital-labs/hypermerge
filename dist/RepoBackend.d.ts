/// <reference types="node" />
import Queue from './Queue';
import { Metadata } from './Metadata';
import { Actor } from './Actor';
import * as Clock from './Clock';
import { ToBackendQueryMsg, ToBackendRepoMsg, ToFrontendRepoMsg } from './RepoMsg';
import { Change, RegisteredLens } from 'cambria-automerge';
import * as DocBackend from './DocBackend';
import { ActorId, DocId, RepoId } from './Misc';
import FeedStore from './FeedStore';
import FileStore from './FileStore';
import Network from './Network';
import NetworkPeer from './NetworkPeer';
import { Swarm, JoinOptions } from './SwarmInterface';
import { PeerMsg } from './PeerMsg';
import ClockStore from './ClockStore';
import CursorStore from './CursorStore';
import MessageRouter from './MessageRouter';
import KeyStore from './KeyStore';
import ReplicationManager, { Discovery } from './ReplicationManager';
export interface FeedData {
    actorId: ActorId;
    writable: Boolean;
    changes: Change[];
}
export interface Options {
    path?: string;
    memory?: boolean;
    lenses: RegisteredLens[];
}
export declare class RepoBackend {
    path?: string;
    storage: Function;
    feeds: FeedStore;
    keys: KeyStore;
    files: FileStore;
    clocks: ClockStore;
    cursors: CursorStore;
    actors: Map<ActorId, Actor>;
    docs: Map<DocId, DocBackend.DocBackend>;
    meta: Metadata;
    opts: Options;
    toFrontend: Queue<ToFrontendRepoMsg>;
    id: RepoId;
    network: Network;
    messages: MessageRouter<PeerMsg>;
    replication: ReplicationManager;
    lenses: RegisteredLens[];
    lockRelease?: () => void;
    swarmKey: Buffer;
    private db;
    private fileServer;
    constructor(opts: Options);
    startFileServer: (path: string) => void;
    private registerLens;
    private create;
    localActorId(docId: DocId): ActorId | undefined;
    private debug;
    private open;
    merge(id: DocId, clock: Clock.Clock): void;
    close: () => Promise<void>;
    private allReadyActors;
    private loadDocument;
    private getReadyActor;
    storageFn: (path: string) => (name: string) => any;
    initActorFeed(doc: DocBackend.DocBackend): ActorId;
    actorIds(doc: DocBackend.DocBackend): ActorId[];
    docActors(doc: DocBackend.DocBackend): Actor[];
    syncReadyActors: (ids: ActorId[]) => void;
    private getGoodClock;
    private documentNotify;
    onPeer: (peer: NetworkPeer) => void;
    onDiscovery: ({ feedId, peer }: Discovery) => void;
    private onMessage;
    private actorNotify;
    private initActor;
    syncChanges: (actor: Actor) => void;
    /** @deprecated Use addSwarm */
    setSwarm: (swarm: Swarm, joinOptions?: JoinOptions | undefined) => void;
    addSwarm: (swarm: Swarm, joinOptions?: JoinOptions | undefined) => void;
    removeSwarm: (swarm: Swarm) => void;
    subscribe: (subscriber: (message: ToFrontendRepoMsg) => void) => void;
    handleQuery: (id: number, query: ToBackendQueryMsg) => Promise<undefined>;
    receive: (msg: ToBackendRepoMsg) => undefined;
    actor(id: ActorId): Actor | undefined;
}
