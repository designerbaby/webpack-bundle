### 一个小型的webpack原理demo

- 文件目录：
  - src demo源码被用于打包的。
  - bundle.js 小型的webpack打包器，将代码转成可以被浏览器直接执行的代码
    - moduleAnalyser 这个方法用于模块解析。先读取文件，再借助@babel/parser进行转译成对象，然后借助@babel/traverse进行解析，拿到import的东西，然后拼接成想要的对象。
    - makeDependenciesGraph 这个方法使用递归循环多次调用moduleAnalyser方法，层层遍历，最后从入口文件到引入的所有的文件都生成1个大的对象。
    - generateCode 这个方法引用makeDependenciesGraph生成的对象转成可以执行的代码。里面使用了闭包和递归，多层嵌套。
  - dist.js src目录下的文件经过bundle生成的可执行代码，被我放在了这里
  - index.html 这个文件去引用测试下。