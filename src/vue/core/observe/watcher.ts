import {pushTarget, popTarget} from './dep';
import { util } from '../compile/compile1.0'

let id = 0;
class Watcher {
    public vm;
    public expOrFn;
    public cb;
    public id;
    public deps: any[];
    public newDeps: any[];
    public depIds;
    public newDepIds;
    public value: any;
    public getter: Function;
    public lazy;
    public dirty;

    constructor(vm, expOrFn: string | Function,  cb?: Function, options?: A_object){
        this.vm = vm;
        this.expOrFn = expOrFn;
        this.cb = cb;
        this.id = id++;

        if(options){
            this.lazy = options.lazy
            this.dirty = this.lazy
        }

        this.deps = []
        this.newDeps = []
        this.depIds = new Set()
        this.newDepIds = new Set()

        if(typeof expOrFn === 'function'){
            this.getter = expOrFn
        }else{
            this.getter = function () {
                return util.getValue(vm, expOrFn)
            }
        }
        this.value = this.lazy? undefined : this.get()
    }

    get(){
        pushTarget(this)
        // Dep.target = this;
        let value = this.getter.call(this.vm)
        popTarget()
        this.cleanupDeps()
        // Dep.target = null
        return value
    }

    addDep(dep){
        let id = dep.id;
        // if( !this.depIds.has(id) ){
        //     this.depIds.add(id)
        //     this.deps.push(dep)
        // }

        if (!this.newDepIds.has(id)) {
            this.newDepIds.add(id)
            this.newDeps.push(dep)
            if (!this.depIds.has(id)) {
                dep.addSubs(this)
            }
        }


    }


    update(){
        /**==========简化版 ===========*/
        // this.run()
        /**==========优化版本1.0=============*/
        if(this.lazy){
            this.dirty = true
        }else{
            queueWatcher(this)
        }

        // this.run()
    }

    run(){
        const val = this.get();
        if (val !== this.value) {
            this.value = val;
            this.cb.call(this.vm, val);
        }
    }

    evalValue(){
        this.value = this.get()
        this.dirty = false;
    }

    depend(){
       let i = this.deps.length;
       while(i--){
           this.deps[i].depend()
       }
    }

    cleanupDeps(){
        let i = this.deps.length;
        while ( i-- ){
            let dep = this.deps[i]
            if(!this.newDepIds.has(dep.id)){
                dep.removeSub(this)
            }
        }
        let tmp = this.depIds
        this.depIds = this.newDepIds
        this.newDepIds = tmp
        this.newDepIds.clear()
        tmp = this.deps
        this.deps = this.newDeps
        this.newDeps = tmp
        this.newDeps.length = 0
    }

}




/**==========优化版本1.0=============*/
let has = {}
let queue: any[] = []

function flushQueue() {
    queue.forEach(( watcher: Watcher ) =>{
        watcher.run()
    })
    has = []
    queue = []
}

function queueWatcher( watcher) {
    let id = watcher.id;
    if(has[id] == null){
        has[id] = true
        queue.push(watcher)
    }
    nextTick(flushQueue)
}
let callbacks: any[] = []

function flushCallbacks() {
    // console.log("我来执行callbacks");
    // console.log(callbacks);
    callbacks.forEach(cb=>cb())
    callbacks = []
}
function nextTick(flushQueue) {
    callbacks.push(flushQueue)
    Promise.resolve().then(flushCallbacks)
}
/**==========优化版本1.0=============*/

export default Watcher
