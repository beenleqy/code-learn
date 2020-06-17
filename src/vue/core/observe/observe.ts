import Dep from './dep';
import { def } from '../util/index';
import { arrayMethods } from './array'

export default function observe (data) {
    if( typeof data != 'object' || data == null){
        return
    }
    if (data.__ob__){
        return data.__ob__
    }
    return new Observe(data)
}
class Observe {
    public dep: Dep;

    constructor(data){
        // 便于添加到__ob__属性上，重新数组方法时便于调用
        this.dep = new Dep();
        def(data, '__ob__', this)
        if(Array.isArray(data)){
            protoAugment(data, arrayMethods)
            this.observeArray(data)
        }else{
            this.walk(data)
        }
    }

    walk(data){
        Object.keys(data).forEach( (key) => {
            defineReactive(data, key, data[key])
        })
    }

    observeArray(items: Array<any>) {
        for(let i = 0; i < items.length; i++){
            observe(items[i])
        }
    }
}

function defineReactive(data, key, value) {
//    观察value是不是对象，是的话需要监听它的属性
    let childOb = observe(value);
    let dep = new Dep()
    Object.defineProperty(data, key, {
        get(){

            // js单线程，全局只会有一个target，
            if(Dep.target){
                dep.depend()
                if(childOb){
                    childOb.dep.depend()
                }
            }
            return value
        },
        set(newVal){
            if(newVal === value) return
            value = newVal
            // console.log('触发更新。。。。。。')
            observe(value)
            dep.notify()
        }
    })
}

function protoAugment (target, src: Object) {
    /* eslint-disable no-proto */
    target.__proto__ = src
    /* eslint-enable no-proto */
}


