import Dep from './dep';
import { util } from '../compile/compile1.0'

let id = 0;
class Watcher {
    public vm;
    public expOrFn;
    public cb;
    public id;
    public deps: any[] = [];
    public depsId = new Set();
    public value;
    public getter;

    constructor(vm, expOrFn, cb = () => {}){
        this.vm = vm;
        this.expOrFn = expOrFn;
        this.cb = cb;
        this.id = id++;

        if(typeof expOrFn === 'function'){
            this.getter = expOrFn
        }else{
            this.getter = function () {
                return util.getValue(vm, expOrFn)
            }
        }
        this.get()
    }

    get(){
        // pushTarget(this)
        Dep.target = this;
        let value = this.getter.call(this.vm)
        // popTarget()
        Dep.target = null
        return value
    }

    addDep(dep){
        let id = dep.id;
        if( !this.depsId.has(id) ){
            this.depsId.add(id)
            this.deps.push(dep)
        }

        dep.addSubs(this)
    }


    update(){
        /**==========简化版 ===========*/
        // this.run()
        /**==========优化版本1.0=============*/
        queueWatcher(this)
        // this.run()
    }

    run(){
        const val = this.get();
        if (val !== this.value) {
            this.value = val;
            this.cb.call(this.vm, val);
        }
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
