import { def } from '../util/index';

// 保存数组原型
const arrayProto = Array.prototype;
export const arrayMethods = Object.create(arrayProto);

const methodsToPatch = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']

methodsToPatch.forEach(function (method) {
    const original = arrayProto[method]
    def(arrayMethods, method, function  mutator(...args) {
        // 使用this报错：'this' implicitly has type 'any' because it does not have a type annotation.
        // 解决：tsconfig.json 中修改 compilerOptions: { "noImplicitThis": false}
        /**
        * @param: this(用户调用methodsToPatch中方法的数组)
        * */
        const result = original.apply(this, args)
        // ob: Observe
        const ob = this.__ob__;
        // 保存新增属性
        let inserted: any;
        switch (method) {
            case 'push':
            case 'unshift':
                inserted = args
                break
            // splice 参数 start(修改起始位置); deleteCount(删除元素的个数)，item(要插入的元素)
            case 'splice':
                inserted = args.slice(2)
                break
            default:
                break
        }

        if(inserted) ob.observeArray(inserted);

        ob.dep.notify()

        return result
    })

})
