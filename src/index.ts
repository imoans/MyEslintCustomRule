import { Rule } from 'eslint'
import {
  CallExpression,
  Literal,
  Node,
  ArrowFunctionExpression,
  FunctionDeclaration,
  FunctionExpression,
} from 'estree'

/**
 * dispatchが第一引数の関数のスコープまたは、dispatch関数内で、
 * $path関数の引数が重複しないようにするルール
 */
const rule: Rule.RuleModule = {
  create: context => {
    let argumentsById: {
      [id: string]: string[][]
    } = {}
    let idStack: string[] = []

    const onStartFunction = (node: Node) => {
      const { params } = node as
        | ArrowFunctionExpression
        | FunctionDeclaration
        | FunctionExpression

      if (params.length === 0) return
      const firstParam = params[0]
      if (firstParam.type !== 'Identifier') return
      if (firstParam.name !== 'dispatch') return

      const { line, column } = node.loc!.start
      idStack.push(`function${line}-${column}`)
    }

    const onEndFunction = (node: Node) => {
      const { params } = node as
        | ArrowFunctionExpression
        | FunctionDeclaration
        | FunctionExpression

      if (params.length === 0) return
      const firstParam = params[0]
      if (firstParam.type !== 'Identifier') return
      if (firstParam.name !== 'dispatch') return
      idStack.pop()
    }

    return {
      ArrowFunctionExpression: onStartFunction,
      FunctionDeclaration: onStartFunction,
      FunctionExpression: onStartFunction,
      'ArrowFunctionExpression:exit': onEndFunction,
      'FunctionDeclaration:exit': onEndFunction,
      'FunctionExpression:exit': onEndFunction,
      'CallExpression:exit': (node: Node) => {
        const { callee } = node as CallExpression
        if (callee.type !== 'Identifier') return
        if (callee.name === 'dispatch') {
          idStack.pop()
          return
        }
      },
      CallExpression: node => {
        const { callee, arguments: args } = node as CallExpression
        if (callee.type !== 'Identifier') return

        if (callee.name === 'dispatch') {
          const { line, column } = node.loc!.start
          idStack.push(`dispatch${line}-${column}`)
          return
        }

        if (callee.name !== '$path') return
        const path = args
          .filter<Literal>(
            (argument): argument is Literal => argument.type === 'Literal',
          )
          .map(({ value }) => value) as string[]
        const id = idStack.slice(-1)[0]
        if (id == null) return
        const currentArgs = argumentsById[id] || []
        argumentsById[id] = [...currentArgs, path]
        const includes = currentArgs.filter(arg => isIncludedPath(arg, path))

        if (includes.length > 0) {
          context.report({
            node,
            message: `${path[0]} is specified ${includes.length +
              1} times in the argument of $path method`,
          })
        }
      },
    }
  },
}

const isIncludedPath = (a: string[], b: string[]) => {
  const sortedByLength = [a, b].sort((c, d) => c.length - d.length)
  const short = sortedByLength[0].slice()
  const long = sortedByLength[1]
  let index = 0
  while (short.length > 0 && long[index] === short[index]) {
    short.pop()
    index++
  }
  return short.length === 0
}

export = rule
