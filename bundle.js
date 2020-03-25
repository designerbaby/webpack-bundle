const path = require('path');
const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core')

const moduleAnalyser = (filename) => {
  const constent = fs.readFileSync(filename, 'utf-8') // 读取这个入口文件
  const ast = parser.parse(constent, { // 转换成1个对象
    sourceType: 'module'
  })
  const dependencies = {}
  traverse(ast, { // 将对象进行解析
    ImportDeclaration({ node }) { // 处理里面的import模块
      const dirname = path.dirname(filename)
      // console.log('node:', node.source.value)
      const newFile = './' + path.join(dirname, node.source.value) //处理成绝对路径
      // console.log('dirname:', dirname)
      dependencies[node.source.value] = newFile
    }
  })
  const { code } = babel.transformFromAst(ast, null, { // 借助babal转换成可执行的代码
    presets: ['@babel/env']
  })
  return {
    filename,
    dependencies,
    code
  }
}

const makeDependenciesGraph = (entry) => { // 生成多个对象
  const entryModule = moduleAnalyser(entry) // 拿到入口模块
  const graphArray = [ entryModule ] // 对入口模块用数组包起来，为了后面递归方便
  for (let i = 0; i < graphArray.length; i++) {
    const item = graphArray[i]
    // console.log('item:', item)
    const { dependencies } = item
    if (dependencies) {
      for(let j in dependencies) {
        graphArray.push(moduleAnalyser(dependencies[j])) // 这里巧妙的将生成的模块再push进行，然后进行递归
      }
    }
  }
  const graph = {}
  graphArray.forEach(item => { // 组合成想要的代码
    graph[item.filename] = {
      dependencies: item.dependencies,
      code: item.code
    }
  })
  return graph
}

const generateCode = (entry) => { // 生成代码
  const graphInfo = JSON.stringify(makeDependenciesGraph(entry)) // 拿到对象
  return `
    (function(graph){  //这里用个闭包传进来
      function req(module) { // 这段代码
        function localRequire(relativePath) {
          return req(graph[module].dependencies[relativePath]) // 在这里实现了循环执行
        }
        var exports = {}
        var abc = function(require, exports, code){
          eval(code) // 执行生成代码
        }
        abc(localRequire, exports, graph[module].code)
        return exports
      }
      req('${entry}')
    })(${graphInfo})
  `
}

const code = generateCode('./src/index.js')
// eval(code)
fs.writeFileSync('./dist.js', code) // 额外把代码输出出去

// code的源码如下：
// "use strict";
// Object.defineProperty(exports, "__esModule", { value: true});
// exports["default"] = void 0;
// var _word = require("./word.js");
// var message = "say ".concat(_word.word);
// var _default = message;
// exports["default"] = _default;

// 生成了这个exports:
// {
//   __esModule: true,
//   default: 'say hello'
// }
