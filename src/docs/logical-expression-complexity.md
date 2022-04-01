# Rule: logical-expression-complexity

This rule enforces complexity limits on logical expressions, using two metrics: tree height and number of terms. As logical expressions get larger and more complex, they also get harder to read, and it can be helpful to break them up by assigning parts of them to separate variables to make code easier to understand.

Brief explanation: when JS source is parsed, the source is put into a tree structure called an abstract syntax tree. This rule is concerned with just the trees that correspond to logical expressions, e.g. `a && b || c`.

`fixable`: no

`hasSuggestions`: no

Some example trees of logical expressions:
```
1           2               3                       4                   5
a && b      a && b && c     (a || b) && (c || d)    a || b || c || d    (a || b) || (c || d)

  &&            &&                   &&                    ||                    ||
 /  \          /  \               /      \                /  \                /      \
a    b        &&   c           ||          ||            ||   d            ||          ||
             /   \            /  \        /  \          /  \              /  \        /  \
            a     b         a      b    c      d      ||    c           a      b    c      d
                                                     /  \
                                                    a    b

height: 1   height: 2       height: 2               height: 3           height: 2
terms:  2   terms:  3       terms:  4               terms:  4           terms:  4
```

The height of the tree is the number of path segments from the root (top) node to the farthest leaf (bottom/no children) node. The more complex an expression is, the more height the tree tends to have. However, this isn't always the case; note that expressions 4 and 5 are logically the same, but the parentheses cause tree 5 to be more balanced, and so it has a shorter height.

The number of terms is the number of parts of the tree that are not themselves logical expressions. These can be variables, function calls, literals, etc.

The exact number of terms and the measured height reported by the rule can vary based on configuration of the `binaryOperators` and `includeTernary` parameters. See the following:

```
// binaryOperators: ["!==", "<"], includeTernary: true
6a                      7a                      8a                      9a
a && b && (c !== d)     (a && b) !== (c && d)   a && (b ? c : d)        a && (b < c)

       &&                   !==                     &&                    &&
     /    \                /   \                  /    \                 /  \
  &&       !==            &&    c               a       ?:              a     <
 /  \     /   \          /  \                        /  |  \                /   \
a    b   c     d        a    b                      b   c   d              b     c
```

Examples 6a and 7a show strict inequality comparison, 8a the ternary operator, and 9a less-than comparison. With these operators enabled, the operators and their child nodes are included in the trees and count toward the height and node calculations. The figures below show the same expressions using different configs:

```
// binaryOperators: [], includeTernary: false
6b                      7b                      8b                      9b
a && b && (c !== d)     (a && b) !== (c && d)   a && (b ? c : d)        a && (b < c)

       &&                 &&          &&            &&                      &&
     /    \              /  \        /  \         /    \                  /    \
  &&     !== expr       a    b      c    d      a    ?: expr            a     < expr
 /  \
a    b

inequality expression   now 2 trees, because    ternary expression is   less-than expression is
is treated as a leaf    !== isn't part of a     treated as a leaf node. treated as a leaf node.
node. only 3 terms      logical expression      only 2 terms            only 2 terms
```

6b's logical expression tree now has a leaf node to the right of the root in place of the whole ternary expression. 7b is now 2 separate trees because the `!==` operator is not included in analyzing logical expressions. Like 6b, 8b and 9b also show that when an unsupported operator is below the root, it is treated as a leaf node and its children are ignored in this particular tree. If its children contain logical expressions, they will be analyzed separately.

example configuration:
```javascript
"rules": {
    "sequence/logical-expression-complexity": [
        "error", {
            "maxHeight": 3,
            "maxTerms": 6,
            "binaryOperators": ["==", "===", "!=", "!=="],
            "includeTernary": true
        }
    ],
    ...
}
```

# Configuration

## maxHeight
---

type: `number`

default: `2`

The maximum allowed height of a logical expression tree. The height of an expression tree is the distance from the root to the farthest leaf node. A value less than or equal to zero disables this check. The simplest logical expressions have a height of 1:
```
a && b:

  &&
 /  \
a    b

distance from root (&&) to leaves (either a or b) is 1

!a:

!
|
a

distance from root (!) to leaf (a) is 1
```

## maxTerms
---

type: `number`

default: `4`

The maximum allowed number of terms in a logical expression. If enabled this counts the number of qualifying nodes in an expression tree and compares to the max. A value less than or equal to zero disables this check. The simplest logical expression using only the NOT (`!`) operator has one term; The simplest using binary operators (`&&`, `||`, `??`) have two terms. As such, setting this parameter to `1` would completely forbid usage of `&&`, `||` and `??` and is of limited utility.

## binaryOperators
---

type: `enum[]`

values: `"==", "===", "!=", "!==", "<", "<=", ">", ">="`

default: `[]`

By default, the only binary operators included when calculating complexity are the logical operators (`&&`, `||`, `??`). E.g. `(a && b) !== (c && d)` would be interpreted as two distinct expressions `a && b` and  `c && d`. If you wish to count any of the comparison operators (`==`, `===`, `!=`, `!==`, `<`, `<=`, `>`, `>=`) toward expression complexity, add them to the `binaryOperators` array.

Note: `==` and `===` are considered different operators, as are `!=` and `!==`, so if you include in/equality, you would probably also want to include the strict version and vice versa.

## includeTernary
---

type: `boolean`

default: `true`

`true`: include all parts of a ternary expression when calculating complexity, whether the ternary is the root or part of another expression.

`false`: ternary expressions that are part of other expressions will be considered leaf nodes. For ternary expressions that contain logical expressions (e.g. `(a && b) ? c : d`), the 3 arguments (test, consequent, and alternate) are analyzed independently (just `a && b` above).
