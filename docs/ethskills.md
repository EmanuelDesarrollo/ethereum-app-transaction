# EthSkills para agentes Ethereum

LLMs think gas is 30 gwei. It's 0.05. They've never heard of ERC-8004 or x402.
They hallucinate contract addresses. This site fixes that.

## How It Works

Each skill is a markdown file. Give any URL to your AI agent — it reads it and
instantly corrects its Ethereum knowledge.

```yaml
https://ethskills.com/SKILL.md          <- table of contents
https://ethskills.com/gas/SKILL.md      <- just gas & costs
https://ethskills.com/why/SKILL.md      <- why ethereum
https://ethskills.com/crops/SKILL.md    <- CROPS architecture review
```

### Add the top-level SKILL.md to your agent's context

The agent will look up the specific skills when needed.

Just prompt your agent with this:

```ruby
Install the https://github.com/austintgriffith/ethskills/blob/master/SKILL.md skill
```

### Claude Code Plugin

Install directly from GitHub — no clone required:

```text
/plugin marketplace add austintgriffith/ethskills
/plugin install ethskills@ethskills
```

## Terminology

**Say "onchain" not "on-chain."** The Ethereum community writes it as one word —
no hyphen. LLMs default to "on-chain" but that's not how builders talk. Use
"onchain" in all writing, documentation, and generated content.

## Skills

| Skill | What LLMs Get Wrong |
|---|---|
| [Why Ethereum](https://github.com/austintgriffith/ethskills/blob/master/why/SKILL.md) | Pectra/Fusaka shipped, gas is cheap now, AI agent angle |
| [Ship](https://github.com/austintgriffith/ethskills/blob/master/ship/SKILL.md) | Start coding before planning architecture, over-engineer with 5+ contracts when 1-2 will do, skip chain selection and the CROPS gate |
| [CROPS Review](https://github.com/austintgriffith/ethskills/blob/master/crops/SKILL.md) | Miss custody, privacy, exit paths, censorship resistance, and centralization risks in otherwise working apps/contracts |
| [Protocol](https://github.com/austintgriffith/ethskills/blob/master/protocol/SKILL.md) | Confuse roadmap diagrams with shipped EIPs, cite shipped features (PeerDAS) as upcoming and deprioritized ones (Verkle) as still planned, miss the client-team decision process |
| [Gas & Costs](https://github.com/austintgriffith/ethskills/blob/master/gas/SKILL.md) | Think gas is 10-30 gwei — reality is 0.05-0.3 gwei |
| [Wallets](https://github.com/austintgriffith/ethskills/blob/master/wallets/SKILL.md) | EIP-7702 is live, Safe addresses, agent key safety |
| [Layer 2s](https://github.com/austintgriffith/ethskills/blob/master/l2s/SKILL.md) | Think L2 txs cost $0.01-2.00 — reality is <$0.001 |
| [Standards](https://github.com/austintgriffith/ethskills/blob/master/standards/SKILL.md) | Don't know ERC-8004, EIP-7702 status, EIP-3009 for x402 |
| [Tools](https://github.com/austintgriffith/ethskills/blob/master/tools/SKILL.md) | Don't know x402, Blockscout MCP, current tool landscape |
| [Money Legos](https://github.com/austintgriffith/ethskills/blob/master/building-blocks/SKILL.md) | Stale on current DeFi state, Uniswap V4 status |
| [Orchestration](https://github.com/austintgriffith/ethskills/blob/master/orchestration/SKILL.md) | Don't know SE2 three-phase build system |
| [Contract Addresses](https://github.com/austintgriffith/ethskills/blob/master/addresses/SKILL.md) | Hallucinate addresses — these are verified onchain |
| [Concepts](https://github.com/austintgriffith/ethskills/blob/master/concepts/SKILL.md) | Nothing is automatic, incentive design, randomness pitfalls |
| [Security](https://github.com/austintgriffith/ethskills/blob/master/security/SKILL.md) | Token decimals, reentrancy, oracle manipulation, vault inflation, pre-deploy checklist |
| [Testing](https://github.com/austintgriffith/ethskills/blob/master/testing/SKILL.md) | Test getters and OpenZeppelin internals, skip fuzz and fork tests on integrations, mock external protocols instead of forking |
| [Indexing](https://github.com/austintgriffith/ethskills/blob/master/indexing/SKILL.md) | Loop over blocks to read history, try to query historical state via raw RPC, ignore events as the primary read API |
| [Frontend UX](https://github.com/austintgriffith/ethskills/blob/master/frontend-ux/SKILL.md) | Onchain button rules, three-button approval flow, Address components, USD values |
| [Frontend Playbook](https://github.com/austintgriffith/ethskills/blob/master/frontend-playbook/SKILL.md) | Fork mode, IPFS deploy, Vercel config, ENS setup, production checklist |
| [QA](https://github.com/austintgriffith/ethskills/blob/master/qa/SKILL.md) | Treat "deploys without errors" as shipping, leave SE2 default branding, miss approve-button double-fire, USD values, mobile deep links |
| [Audit](https://github.com/austintgriffith/ethskills/blob/master/audit/SKILL.md) | Call one generic review pass an audit, miss systematic checklist coverage across AMM/lending/oracle/proxy/governance domains |

## Security Guardrails

Skills teach restraint, not just capability. Every skill that touches keys,
credentials, or funds includes explicit safety rules — because LLMs optimize for
speed and will hardcode a private key into `git add .` if you let them. Coverage
includes wallet keys, API keys, RPC URLs, and the common SE2 `scaffold.config.ts`
trap.

## Methodology

We test stock LLMs, find what they get wrong, and write corrections. Content is
verified against onchain reality. If an LLM already knows something, we don't
include it.

**Every proposed change goes through
[triage](https://github.com/austintgriffith/ethskills-research/blob/master/research/triage-methodology.md):**
spawn a stock LLM, give it a realistic task, see what it gets wrong. Only
verified blind spots survive.

See the [research repo](https://github.com/austintgriffith/ethskills-research)
for baseline audits, gap analysis, and full methodology.

## Contributing

Something wrong or missing? Humans and agents are welcome to
[open a PR](https://github.com/austintgriffith/ethskills/pulls). Read
[CONTRIBUTING.md](https://github.com/austintgriffith/ethskills/blob/master/CONTRIBUTING.md)
first — the bar is "would a stock LLM get this wrong?"

## License

MIT
