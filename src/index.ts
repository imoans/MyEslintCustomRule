import { Rule } from 'eslint'
import {
  CallExpression,
  Literal,
  Node,
  ArrowFunctionExpression,
  FunctionDeclaration,
  FunctionExpression,
} from 'estree'

export const rule: Rule.RuleModule = {
  create: context => {
    let argumentCountsByFunctionId: {
      [functionId: string]: { [key: string]: number }
    } = {}
    let functionIdStack: string[] = []

    const onStartFunction = (node: Node) => {
      const { params } = node as
        | ArrowFunctionExpression
        | FunctionDeclaration
        | FunctionExpression

      if (params.length === 0) return
      if (params[0].type !== 'Identifier') return
      if (params[0].name !== 'dispatch') return

      const { line, column } = node.loc!.start
      functionIdStack.push(`function${line}-${column}`)
    }

    const onEndFunction = () => {
      functionIdStack.pop()
    }

    return {
      ArrowFunctionExpression: onStartFunction,
      FunctionDeclaration: onStartFunction,
      FunctionExpression: onStartFunction,
      'ArrowFunctionExpression:exit': onEndFunction,
      'FunctionDeclaration:exit': onEndFunction,
      'FunctionExpression:exit': onEndFunction,
      CallExpression: node => {
        const { callee, arguments: args } = node as CallExpression
        if (callee.type !== 'Identifier') return
        if (callee.name !== '$path') return
        const paths = args
          .filter<Literal>(
            (argument): argument is Literal => argument.type === 'Literal',
          )
          .map(({ value }) => value)
        let firstPath = paths[0] as string
        if (firstPath.includes('.')) {
          firstPath = firstPath.split('.')[0]
        }

        const functionId = functionIdStack.slice(-1)[0]
        const argumentCounts = argumentCountsByFunctionId[functionId]

        const count = (argumentCounts ? argumentCounts[firstPath] || 0 : 0) + 1

        argumentCountsByFunctionId[functionId] = {
          ...argumentCounts,
          [firstPath]: count,
        }

        if (count > 1) {
          context.report({
            node,
            message: `${firstPath} is specified ${count} times in the argument of $path method`,
          })
        }
      },
    }
  },
}
