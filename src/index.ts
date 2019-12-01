import { Rule } from 'eslint'
import { getFunctionNodes, getArguments } from './lib'

export const rule: Rule.RuleModule = {
  create: context => {
    return {
      Program: node => {
        const nodes = getFunctionNodes(node, '$path')
        const argumentArrays = nodes.map(n => getArguments(n))
        const map = argumentArrays.reduce((acc, args) => {
          let firstArgument = args[0] as string
          if (firstArgument.includes('.')) {
            firstArgument = firstArgument.split('.')[0]
          }
          const count = acc[firstArgument] || 0
          acc[firstArgument] = count + 1
          return acc
        }, {} as { [propertyName: string]: number })
        const duplicatedProperties = Object.keys(map).filter(
          key => map[key] > 1,
        )
        if (duplicatedProperties.length > 0) {
          context.report({
            node,
            message: duplicatedProperties
              .map(
                property =>
                  `${property} is specified ${map[property]} times in the argument of $path method`,
              )
              .join('\n'),
          })
        }
      },
    }
  },
}
