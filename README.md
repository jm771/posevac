# POSEVAC

## POSsibility EVAlulating Computer (working title)

The University CompSci department's funding is being slashed - you've been put under a lot of pressure to produce incredible research. It's a stressful time, and worst of all - this weekend you've got to clear our your late eccentric genius father's shed.
In there you find your father's project from the 70s, the POSEVAC. Filled with [vacuum tubes](https://en.wikipedia.org/wiki/Vacuum_tube) and [vacuum tubes](https://en.wikipedia.org/wiki/Pneumatic_tube) the thing looks deranged. But you remember your father talking about it. "A supercomputer that could evalute all possibilities at once". I mean something like that - that wouldn't just solve the university's funding issues - that'd win you a Turing Award! If only you could work out how to use the damn thing!

## Building POSFLOs

(The POSEVAC does not run a program - it evaluates a POSibility FLOw)
Drag and drop nodes from the sidebar to add them to the design. Drop them back on the sidebar to remove them.
Left click / tap an output terminal, and then an input terminal to connect them. "Reconnect" an edge to remove it.
Left click an edge to adjust its condition
Left click a constant node to adjust its settings

At this point Feel free to dive in and just try stuff out - if you need some explaination (the game currently has no tutorial) it's below:

## Operation

The POSEVAC stores it's values in "Possibility Containers" or PCs. The possibility containers flow around the POSEVAC performing calculations. The system operates in alternating phases.

### Evalaute

Every node that has all its input terminals filled. (A node with zero inputs always has all its inputs). And all its output terminals empty, will consume its inputs, evaluate them. Each output terminal will get a Possibilty Container at the start of each (see "conditional flow") edge.

### Advance

Every Possibility Container will advance along all connected edges that have their destination terminal empty.

### Defined Nodes

- Input - inserts boring real world data (a NormVal) from the test harness into a possibility container
- Output - converts a Possibility Container back into a NormVal - then the test harness checks it against the expected output
- Add - adds the inputs
- Multiply - multiplies the inputs
- Combine - takes two inputs and packs them into a pair
- Split - takes a pair and splits them into two outputs
- Constant - produces a constant valued Possibility Container. In OneShot mode it produces a single Possibility Container. In "infinite" mode it'll repatedly produce Possibility Containers.

### Conditional flow

- Left click a node to open the condition editor. This lets you specify matchers. +/- controls the tuple length you're matching against (n.b the current game only has components that produce values (treated the same as 1 length tuples) and pairs. So a matcher of length 3+ won't match anything). Clicking the match condition cycles through what values in that tuple slot will be accepted (any, zero, one, non-zero, non-one).

## Warnings

This is in pre-alpha stage. Lots of the code is messy. It may never get to alpha. Anything and everything may break at any time without warning. (The POSEVAC is highly experimental hardware - just be grateful it mostly doesn't crash parallel universe into eachother)

### Known issues

- The overlay for constant nodes seems buggy and finnicky. If it's unplayable on your machine please tell me!
- Nothing prevents you editing the POSEVAC configuration mid evaluation

### Known non-issues

- If several Possibility Containers attempt to move to the same terminal at the same time only one will succeed. Which one succeeds is undefinied behaviour.

### Future features

- A "play" button to test your output without spam clicking "step"
- Providing some metrics like "runtime" on level completion for people who wish to to optimise

## Developing

I think (please test and tell me) that:

```
npm install
npm run dev
```

Is enough to run it locally.

Adding a new level should be easy `src/levels.ts`
Adding a new Node should be achievable - I will make it easy in future.
For now I'll merge pretty much any PR adding some of either - would take delight in people playing it.

Feel free to contact me if you'd like to work together on some of this. Definitely contact me if you'd like to work on anything more advanced than ^
