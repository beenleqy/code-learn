## vue响应式原理

### 初始化

```
入口: src/core/initState.ts
```
1. 处理用户传入的data，vm._data = (typeof options.data == 'function' ? data.call(vm) : data || {})
2. _proxy方法，通过object.defineProperty将vm._data代理到vm自身上(即可通过this访问)
3. 观察数据, 调用observe(vm._data), 进入src/core/observe

### 观察数据(Observe类)

1. 观察数据是引用类型，且值不为null，满足 返回Observe实例
2. Observe接收监听的数据，将自身实例(this)保存到__ob__属性上，并将此属性赋给data上(便于之后可直接通过data.__ob__获取observe实例)
3. 判断传入的数据类型
     3.1 为数组，重写数组原型(_proto_属性指向重写的方法------重写的详细见下：数组改写)；遍历监听数组内的值(若为引用型数据，也要进行数据劫持)
     3.2 不为数组, 遍历对数据中的每个属性进行劫持(调用defineReactive(data, key, value))
4. 调用defineReactive实现
     4.1 传入的value进行监听
     4.2 实例化一个订阅者(dep)
     4.3 通过Object.defineProperty改写get和set
        4.3.1 get: 是否存在Dep.target(Dep.target指向需要响应的数据，注意：js单线程，全局只会有一个target)
                    存在：则添加订阅依赖（若值是引用类型，也需要添加依赖）
                    返回值
               set: 修改的值和当前值一致，不在执行
                    不一致：用新的值覆盖，对新值进行监听
                    通知订阅者
                    
                    
### 数组重写

观察数据(Observe类) 3.1中使用

```
src/core/observe/array.ts
```
1. 保存数组原型
2. 创建数组方法对象，原型指向 1中保存的原型 (Object.create)
3. 保存要改写的数组方法集合
4. 遍历，缓存保存的原型方法，通过Object.defineProperty对劫持方法，并改写:
      4.1 通过apply 调用缓存的方法
      4.2 缓存自身的__ob__(观察数据(Observe类) 2时已赋值)
      4.3 获取新增数组
      4.4 新增数据存在，要遍历加入监听
      4.4 通知订阅者
      4.4 返回4.1中获取的值

### 订阅者(Dep类) 

1. 订阅者id(自增)
2. 订阅者集合subs
3. 添加订阅者, 将传入的订阅者push到集合(subs)中
4. 通知，遍历集合，更新观察者(watcher.update())
5. 依赖，将自己(this)添加到观察者(Dep.target)中

### 观察者(Watcher类)

#### 简易版

```
src/core/observe/watcher.ts
```
1. 接收vm实例, expOrFn(监听时的动作-----保存到getter上)，回调
2. 观察者id(自增), 调用get, 实现:  
     2.1 Dep.target指向自身(this)
     2.2 .call调用expOrFn ------- 调用data的get收集依赖
     2.3 Dep.target = null
     2.4 返回当前值
3. 更新update(数据变更时，调用set ==》 通知 ==》 进行更新), 调用run(重新执行get)
4. 收集依赖: 首先根据订阅者id判断是否已经收集(未收集，则进行收集)，最后收集订阅者

#### Vue源码版

```
src/core/observe/watcher.ts
```
数据更改后，会收集依赖，每次更新，都会将依赖全部执行一下，为避免重复渲染，需要在简易版基础做一个调整
1. 判断队列是否已经收集过此队列，
2. 否 则收集此队列
3. 调用nextTick，使用callbacks保存要执行的队列
4. 调用Promise.resolve().then 统一执行



