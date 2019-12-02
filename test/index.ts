import { RuleTester } from 'eslint'
import { rule } from '../src'

const tester = new RuleTester({
  env: { es6: true },
  plugins: ['@typescript-eslint'],
  parser: require.resolve('@typescript-eslint/parser'),
})

tester.run('rule', rule, {
  valid: [
    {
      code: "dispatch($set($path('profile'), { name: 'aaa' }))",
    },
  ],
  invalid: [
    {
      errors: ['profile is specified 2 times in the argument of $path method'],
      code:
        "dispatch($merge($set($path('profile'), { name: 'aaa' }), $set($path('profile', 'name'), 'aaa')))",
    },
  ],
})
