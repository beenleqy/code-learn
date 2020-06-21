## computed && watch

### computed(计算属性)

```
src/core/initState.ts  initComputed

 new Vue({
       el: '#app',
       data(){
           return {
               num1: 2,
               num2: 3
           }
       },
       computed: {
           sum(){
               return this.num1 + this.num2
           }
       }
   })
```
1. vm上挂载一个_watcherComputed对象
2. 遍历computed，实例watcher，并赋值给_watcherComputed
     2.1  遍历computed读取key, userdef = computed[key]
     2.2  _watcherComputed[key] = 生成computed watcher(vm, getter, noop, { lazy: true })
3. 再将计算属性挂载到vm(可通过this访问)上
     3.1  定义vm[key]的get和set
     3.2  通过执行defineComputed(vm, key, userDef)实现, 通过get劫持挂载属性的值
     
     
### computed的大致执行过程和数据更新过程

#### 简易版

##### 首次渲染

1.  初始时，生成computed watcher，lazy设为true，且不调用计算属性的函数
2.  模板中用到计算属性时，会调用vm.$mount方法，生成render watcher
3.  当render watcher执行时，会访问到计算属性的值，进而会触发计算属性的get
4.  computed watcher存在，且watcher.dirty为true。会执行watcher.evaluate获得计算属性的值
5.  在执行计算属性函数时，会访问到data中num1和num2的值(data初始化时，已定义好get/set，生成了依赖收集器),触发了vm[num1]/vm[num2]对应的dep进行依赖收集
6.  vm[num1]/vm[num2]的dep就有了computed watcher。当vm[num1]/vm[num2]发生变动时，就能够通知到computed watcher
7.  执行computed watcher的evaluate，然后Dep.target会变成render watcher。dirty会被置为false
8.  调用watcher.depend(), depend函数会把刚才computed watcher添加的deps也添加到render watcher中去，使得vm[num1]/vm[num2]的dep和render watcher也能互相添加到彼此

##### 计算属性中的依赖值改变

1.  依赖值(即vm[num1]/vm[num2])发生变化时，会触发其dep的set。进而触发dep.notify
2.  dep.subs中有两个watcher实例。[computed watcher, render watcher], 遍历执行其update()
3.  computed watcher的update只是简单地把dirty置为了true，以便在下次访问到计算属性时，通过执行evaluate来计算最新的值
4.  render watcher会被放入执行队列中。将当前主线程代码执行完毕后，在下一次事件循环中执行
5.  render watcher.get的执行，计算属性会被重新获取，进而触发计算属性的getter


#### 源码版

1.  根据传入的参数vm, getter, noop ，我们可以大致得到这样一个watcher实例：

```
{
    vm: vm,
    getter: getter,
    cb: noop,
    lazy: true,
    dirty: true,
    ...
}
```

2.  在watcher实例初始化的过程中，会对实例挂载一系列的属性。由于this.lazy是true，所以初始化时得到的 this.value = undefined

```
// 来自 watcher.js
this.value = this.lazy
      ? undefined
      : this.get()
```

3.  假设html模板中用到了computed中的值。在Vue实例init的最后，会调用vm.$mount方法，进而执行到mountComponent函数，mountComponent会生成一个渲染watcher实例
4.  当render watcher执行时，会访问到计算属性的值，进而会触发计算属性的get。计算属性的get在defineComputed中已经定义过了，如下：

```
function createComputedGetter (key) {
  return function computedGetter () {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}
```

5.  然后执行computedGetter。此时，watcher存在，且watcher.dirty为true。会执行watcher.evaluate获得计算属性的值。而在evaluate中，会调用watcher.get方法

```
 // 选自 watcher.js
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }
```

6.  在执行watcher.get方法时，会将Dep.target设置成当前的watcher, 并调用计算属性的函数。即实例中num1所对应的函数。在执行这个函数时，又会访问到data中num1的值，也即是vm[num1]/vm[num2]的值。而在vue的响应式系统中，在初始化时对data中的数据进行了响应式观测，并定义了get和set函数，生成了对应的依赖收集器dep。

计算属性在计算时访问到了vm[num1]/vm[num2]，触发了vm[num1]/vm[num2]对应的dep进行依赖收集。

```

    // 来自 observer/index.js defineReactive
    const value = getter ? getter.call(obj) : val
    // Dep.target此时为computed watcher。
    if (Dep.target) {
        // 使得computed watcher和dep互相添加对方
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
    return value
```

7.  vm[num1]/vm[num2]的dep就有了computed watcher。当vm[num1]/vm[num2]发生变动时，就能够通知到computed watcher。
当computed watcher的evaluate执行完后，Dep.target会变成render watcher。dirty会被置为false。接着往下进行，会执行到watcher.depend(watcher是computed watcher)。

```
  // 来自 watcher.js
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }
```

8.  depend函数会把刚才computed watcher添加的deps也添加到render watcher中去，使得vm[num1]/vm[num2]的dep和render watcher也能互相添加到彼此。这样，当vm[num1]/vm[num2]发生变化时，render watcher也会执行
当watcher.depend执行完后，返回watcher.value。此时，computed watcher就完成了一次计算过程

当vm[num1]/vm[num2]发生变化时，会触发其dep的set。进而触发dep.notify。此时，dep.subs中有两个watcher实例。一个是computed watcher，另一个是render watcher。首先执行computed watcher的update，然后执行render watcher的update

```

  // from watcher.js
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      // computed watcher会走到这里
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      // render watcher会走到这里
      queueWatcher(this)
    }
  }
```

9.  computed watcher的update只是简单地把dirty置为了true，以便在下次访问到计算属性时，通过执行evaluate来计算最新的值。
render watcher会被放入执行队列中。将当前主线程代码执行完毕后，在下一次事件循环中执行。
最终，随着render watcher.get的执行，计算属性会被重新获取，进而触发计算属性的getter，然后通过执行computed watcher的evaluate重新获取计算属性的最新值并返回。





       





