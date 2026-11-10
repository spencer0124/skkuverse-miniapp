/*
 * A FIXTURE, not a game: a page that throws, as it loads, an error it named
 * ContractBroken. A name any page can give an error must not read as the
 * runner's verdict that the page broke the contract.
 */
export {};

throw Object.assign(new Error('a page error, not a verdict'), { name: 'ContractBroken' });
