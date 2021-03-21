import Debug, { IDebugger } from 'debug';
export { IDebugger };
export declare const log: Debug.Debugger;
declare const _default: (namespace: string) => Debug.Debugger;
export default _default;
export declare const trace: (label: string) => <T>(x: T, ...args: any[]) => T;
export declare function assignGlobal(objs: {
    [name: string]: any;
}): void;
