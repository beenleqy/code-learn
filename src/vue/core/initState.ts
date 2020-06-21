import observe from './observe/observe';
import Watcher from './observe/watcher';
import Dep from './observe/dep';

export function initState(vm){
    let opt = vm.$options;

    if(opt.data){
        initData(vm)
    }

    if(opt.computed) {
        initComputed(vm, opt.computed)
    }

}

function initData(vm) {
    let data = vm.$options.data;

    //判断data是对象还是方法
    data = vm._data = typeof data == 'function' ? data.call(vm) : data || {};

    for(let key in data){
        _proxy(vm, '_data', key)
    }

    observe(data)

}

function initComputed(vm, computed) {
    let watchers = vm._watcherComputed = Object.create(null);
    for(let key in computed){
        let userDef = computed[key]
        watchers[key] = new Watcher(vm, userDef, () => {}, {lazy: true})
        Object.defineProperty(vm, key, {
            get: createComputedGetter(vm, key)
        })
    }
}

function createComputedGetter(vm, key) {
    let watcher = vm._watcherComputed[key]
    return function () {
        if(watcher.dirty){
            watcher.evalValue()
        }

        if (Dep.target){
            watcher.depend()
        }

        return watcher.value
    }
}

function _proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
        get: () => {
            return vm[source][key]
        },
        set: ( newVal ) => {
            return vm[source][key] = newVal
        }
    })
}
