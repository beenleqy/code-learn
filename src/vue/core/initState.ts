import observe from './observe/observe';

export function index(vm){
    let opt = vm.$options;

    if(opt.data){
        initData(vm)
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
