## vue 渲染

### mount(挂载)

```
src/index.ts  $mount()
```
1. 通过传入的el，获取dom元素(document.querySelector)
2. 封装更新updateComponent，new Watcher(vm, updateComponent)
3. 更新
     3.1 创建文档碎片(document.createDocumentFragment)
     3.2 将dom元素的子节点，追加到文档碎片中
     3.3 编译 compiler(node, vm)
     3.4 将编译后的node追加到dom元素中

### compiler(编译)

#### 简易版

```
src/core/compile/compile1.0.ts
```

1. 获取子节点(node.childNodes), 转成真正的数组(Array.from)
2. 遍历，判断节点(nodeType):
     2.1 1(dom节点): 递归(compiler(child, vm))
     2.2 3(文本节点): 编译文本节点
3. 封装工具
     3.1  根据变量取值(getValue):
                 3.1.1 解析变量(如：a.b.c), 截取. 获取key集合([a,b,c])
                 3.1.2 reduce处理key为a[b[c]]，返回vm实例中真实值
     3.2  文本节点编译:
            3.2.1 获取文本内容
            3.2.2 正则替换，获取{{ }}中的变量，调用getValue获取真实值
            
```
// 匹配{{ }}中的内容
const defaultRGE = /\{\{((?:.|\r?\n)+?)\}\}/g
```         
            
#### Vue源码版




