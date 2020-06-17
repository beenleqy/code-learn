import { index } from './core/initState';
import Watcher from './core/observe/watcher';
import { compiler } from './core/compile/index';

class Vue {
    public $options;
    public $el;

    constructor(options) {
        this._init(options)
    }

    _init(options){
        let vm = this;
        vm.$options = options;
        index(vm)
        if(vm.$options.el){
            vm.$mount()
        }
    }

    $mount(){ //挂载
        let vm = this
        let el = vm.$options.el;
        el = vm.$el = query(el) //获取dom元素
        let updateComponent = () => {
            vm._update() //更新
        }

        //监听
        new Watcher(vm, updateComponent)
    }

    _update(){
        let vm = this;
        let el = vm.$el;

        //创建文档碎片
        let node = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            node.appendChild(firstChild)
        }
        //编译
        compiler(node, vm)
        el.appendChild(node)
    }

}

function query(el) {
    if(typeof el == 'string'){
        return document.querySelector(el)
    }
    return el
}

export default Vue
