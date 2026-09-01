## OpenZeppelin Documentation Standards

OpenZeppelin has implemented a categorization standard to be used across all ecosystems to help ensure our contributors cover the bases for the ideal documentation:

![From [`https://docs.divio.com/documentation-system/`](https://docs.divio.com/documentation-system/)](https://docs.divio.com/assets/images/overview-8b21327c9a55ca08c6712f26bda2113c.png)

From [`https://docs.divio.com/documentation-system/`](https://docs.divio.com/documentation-system/)

The OpenZeppelin approach to achieve this goal will include the following sections

### Quickstart

*Zero to working project in one page*

👤 Primary Owner: Library Developers

⊞ Quadrant: Problem-Oriented/How-To Guides

📖 [Quickstart Example](https://docs.openzeppelin.com/relayer/quickstart)


### Learn

*Conceptual learning about the library or tool that include example usage code snippets*

👤 Primary Owner: Library Developers

⊞ Quadrant: Understanding-Oriented/Explanation

📖 [Learn Example](https://docs.openzeppelin.com/contracts/5.x/utilities)


### Guides / Tutorials

*Step by step guides to achieve a particular goal or solve a specific problem*

👤 Primary Owner: Devrel

⊞ Quadrants: Problem-Oriented/How-To Guides & Learning-Oriented/Tutorials

📖 [Guide Example](https://docs.openzeppelin.com/contracts/5.x/learn/webauthn-smart-accounts)


### Reference

*Easy to access answers for a specific implementation*

👤 Primary Owner: Library Developers

⊞ Quadrants: Information-Oriented/Reference

📖 [Reference Example](https://docs.openzeppelin.com/contracts-cairo/4.x/api/access)


It should be noted that not every library or tool may have every section, and that’s ok. This is purely a guide to help kickstart helpful documentation, not a strict pattern to follow.


## Implementation

- All developers should keep this pattern in mind as they build out their documentation
- Devrel will step in to help create tutorials for releases, contributions from primary developers welcome if time allows
- Devrel will review all documentation PRs for QA and provide feedback

## FAQ

- **Who should my Quickstart target?**

    Write your quickstart as if the reader has basic dev knowledge (node.js, some solidity, CLI tools, etc) but knows nothing about your library or how to get it started with particular ecosystem tools. By all means link out to other instructions that help new users get their dev environment setup

- **What if my tool or library has documentation that doesn’t fit into these categories?**

    That’s ok! Ideally everything should fit into these categories, but if not then craft your docs for the optimal user experience first and foremost. If you’re unsure then contact @Steve Simkins

- **What if I don’t have enough content to fill a category (ie there’s just one guide)**

    If you find yourself in a case where the categorization doesn’t fit because there isn’t enough content to fill those sections, refactor them to fit your use-case. @Steve Simkins will review changes to make sure they align.

- **What if I don’t know how to communicate the concepts or ideals behind what I’m building?**

    This is normal! Writing and communication is a skill that takes time. If you find yourself stuck or need assistance with writing docs just let @Steve Simkins know!
