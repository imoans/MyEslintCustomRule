import { CallExpression, Literal, Node } from 'estree'

export const getFunctionNodes = (
  node: Node,
  name: string,
): CallExpression[] => {
  if (node.type === 'Program') {
    return node.body.reduce((acc: any, body: any) => {
      acc = acc.concat(getFunctionNodes(body, name))
      return acc
    }, [])
  }
  if (node.type === 'ArrayExpression') {
    return node.elements.reduce((acc: any, body: any) => {
      acc = acc.concat(getFunctionNodes(body, name))
      return acc
    }, [])
  }
  if (node.type === 'VariableDeclarator') {
    if (node.init == null) return []
    return getFunctionNodes(node.init, name)
  }
  if (node.type === 'VariableDeclaration') {
    return node.declarations.reduce((acc: any, body: any) => {
      acc = acc.concat(getFunctionNodes(body, name))
      return acc
    }, [])
  }
  if (node.type === 'BlockStatement') {
    return node.body.reduce((acc: any, body: any) => {
      acc = acc.concat(getFunctionNodes(body, name))
      return acc
    }, [])
  }
  if (node.type === 'CallExpression') {
    return node.arguments.reduce((acc: any, arg: any) => {
      if (arg.callee && arg.callee.name === name) {
        acc = acc.concat(arg)
        return acc
      }
      acc = acc.concat(getFunctionNodes(arg, name))
      return acc
    }, [])
  }
  if (node.type === 'TryStatement') {
    return getFunctionNodes(node.block, name)
  }
  if (node.type === 'ArrowFunctionExpression') {
    return getFunctionNodes(node.body, name)
  }
  if (node.type === 'ExpressionStatement') {
    return getFunctionNodes(node.expression, name)
  }
  if (node.type === 'IfStatement') {
    return getFunctionNodes(node.consequent, name)
  }
  return []
}

export const getArguments = (node: CallExpression) => {
  return node.arguments
    .filter<Literal>(
      (argument): argument is Literal => argument.type === 'Literal',
    )
    .map(({ value }) => value)
}
